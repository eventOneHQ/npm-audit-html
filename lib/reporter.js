const terminalLink = require('terminal-link')
const Handlebars = require('handlebars')
const moment = require('moment')
const marked = require('marked')
const fs = require('fs-extra')
const chalk = require('chalk')
const numeral = require('numeral')
const highlight = require('highlight.js')

const severityMap = {
  info: {
    color: 'info',
    number: 5,
    badgeClass: 'bg-slate-500 text-white'
  },
  low: {
    color: 'primary',
    number: 4,
    badgeClass: 'bg-blue-500 text-white'
  },
  moderate: {
    color: 'secondary',
    number: 3,
    badgeClass: 'bg-amber-500 text-white'
  },
  high: {
    color: 'warning',
    number: 2,
    badgeClass: 'bg-orange-500 text-white'
  },
  critical: {
    color: 'danger',
    number: 1,
    badgeClass: 'bg-red-600 text-white'
  }
}

const generateTemplate = async (data, template) => {
  const htmlTemplate = await fs.readFile(template, 'utf8')
  return Handlebars.compile(htmlTemplate)(data)
}

const writeReport = async (report, output) => {
  await fs.ensureFile(output)
  await fs.writeFile(output, report)
}

/**
 * Normalize npm audit v2 format (npm >= 7) to the v1-compatible structure
 * expected by the template.
 */
const normalizeV2Data = data => {
  const advisories = {}

  for (const [pkgName, vuln] of Object.entries(data.vulnerabilities || {})) {
    for (const via of vuln.via || []) {
      if (!via || typeof via !== 'object' || !via.source) {
        continue
      }

      const id = via.source

      let patchedVersions = ''
      if (vuln.fixAvailable === true) {
        patchedVersions = 'Fix available'
      } else if (vuln.fixAvailable && typeof vuln.fixAvailable === 'object') {
        patchedVersions = `>=${vuln.fixAvailable.version}${vuln.fixAvailable.isSemVerMajor ? ' (breaking change)' : ''}`
      }

      const nodePaths = (vuln.nodes || []).map(nodePath => nodePath.replace(/^node_modules\//, ''))

      if (!advisories[id]) {
        advisories[id] = {
          id,
          title: via.title,
          module_name: via.name || pkgName,
          severity: via.severity,
          url: via.url,
          cwe: Array.isArray(via.cwe) ? via.cwe.join(', ') : (via.cwe != null ? String(via.cwe) : ''),
          cves: [],
          overview: '',
          recommendation: patchedVersions ? `Update to ${patchedVersions}` : '',
          references: '',
          vulnerable_versions: via.range || vuln.range || '',
          patched_versions: patchedVersions,
          findings: [{ paths: nodePaths }]
        }
      } else {
        advisories[id].findings.push({ paths: nodePaths })
      }
    }
  }

  return {
    advisories,
    metadata: {
      vulnerabilities: data.metadata.vulnerabilities,
      totalDependencies: data.metadata.dependencies ? data.metadata.dependencies.total : 0
    }
  }
}

const modifyData = async data => {
  const vulnerabilities = data.metadata.vulnerabilities || {}

  // Calculate total only if not already set (v2 format already includes total)
  if (vulnerabilities.total === undefined) {
    let total = 0
    for (const vul in vulnerabilities) {
      total += vulnerabilities[vul]
    }
    data.metadata.vulnerabilities.total = total
  }

  data.date = Date.now()

  return data
}

module.exports = async (data, templateFile, outputFile, theme) => {
  try {
    if (!data.metadata) {
      if (data.updated || data.added) {
        console.log(
          chalk.red(
            `Sorry! You can't use ${chalk.underline(
              'npm audit fix'
            )} with npm-audit-html.\n\nSee ${terminalLink(
              'issue #3',
              'https://github.com/eventOneHQ/npm-audit-html/issues/3'
            )}`
          )
        )
      } else {
        console.log(
          chalk.red(
            `The provided data doesn't seem to be correct. Did you run with ${chalk.underline(
              'npm audit --json'
            )}?`
          )
        )
      }
      process.exit(1)
    }

    // Normalize npm audit v2 format (npm >= 7) to a v1-compatible structure
    const normalizedData = data.auditReportVersion >= 2 ? normalizeV2Data(data) : data

    const modifiedData = await modifyData(normalizedData)
    modifiedData.theme = theme
    const report = await generateTemplate(modifiedData, templateFile)
    await writeReport(report, outputFile)
    return modifiedData
  } catch (err) {
    console.log(err)
  }
}

Handlebars.registerHelper('moment', (date, format) =>
  moment.utc(date).format(format)
)

Handlebars.registerHelper('numeral', (number, format) =>
  numeral(number).format(format)
)

Handlebars.registerHelper('if_eq', (a, b, opts) => {
  if (a === b) {
    return opts.fn(this)
  } else {
    return opts.inverse(this)
  }
})

Handlebars.registerHelper(
  'severityClass',
  severity => severityMap[severity].color
)

Handlebars.registerHelper(
  'severityNumber',
  severity => severityMap[severity].number
)

Handlebars.registerHelper(
  'severityBadgeClass',
  severity => severityMap[severity] ? severityMap[severity].badgeClass : 'bg-slate-500 text-white'
)

Handlebars.registerHelper('markdown', source =>
  source
    ? marked(source, {
        highlight: code => {
          return highlight.highlightAuto(code).value
        },
        gfm: true
      })
    : ''
)
