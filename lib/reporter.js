import terminalLink from 'terminal-link'
import Handlebars from 'handlebars'
import moment from 'moment'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import fs from 'fs-extra'
import chalk from 'chalk'
import numeral from 'numeral'
import hljs from 'highlight.js'

// Configure marked with syntax highlighting for code blocks
marked.use(
  markedHighlight({
    highlight (code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    }
  })
)

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

/**
 * Convert a fixAvailable value to a human-readable string.
 */
const fixAvailableText = fixAvailable => {
  if (!fixAvailable) return ''
  if (fixAvailable === true) return 'Fix available'
  if (typeof fixAvailable === 'object') {
    return `>=${fixAvailable.version}${fixAvailable.isSemVerMajor ? ' (breaking change)' : ''}`
  }
  return ''
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
 * Normalize npm audit v1 format (npm < 7) to the v2 structure used by the
 * template.  v2 data passes through without modification.
 */
const normalizeV1Data = data => {
  const vulnerabilities = {}

  for (const advisory of Object.values(data.advisories || {})) {
    const pkgName = advisory.module_name

    const cwe = advisory.cwe ? [].concat(advisory.cwe) : []

    // Convert v1 path "a > b > c" → v2 node "node_modules/a/node_modules/b/node_modules/c"
    const nodes = []
    for (const finding of advisory.findings || []) {
      for (const p of finding.paths || []) {
        const node = 'node_modules/' + p.split(' > ').join('/node_modules/')
        if (!nodes.includes(node)) nodes.push(node)
      }
    }

    let fixAvailable = false
    if (advisory.patched_versions && advisory.patched_versions !== '<0.0.0') {
      fixAvailable = true
    }

    vulnerabilities[pkgName] = {
      name: pkgName,
      severity: advisory.severity,
      isDirect: false,
      via: [
        {
          source: advisory.id,
          name: pkgName,
          dependency: pkgName,
          title: advisory.title,
          url: advisory.url,
          severity: advisory.severity,
          cwe,
          range: advisory.vulnerable_versions || '',
          // Preserve v1-only narrative fields so the template can show them
          overview: advisory.overview || '',
          recommendation: advisory.recommendation || '',
          references: advisory.references || ''
        }
      ],
      effects: [],
      range: advisory.vulnerable_versions || '',
      nodes,
      fixAvailable
    }
  }

  const vulnMeta = data.metadata.vulnerabilities || {}
  const total =
    vulnMeta.total !== undefined
      ? vulnMeta.total
      : Object.entries(vulnMeta).reduce(
        (sum, [, n]) => sum + (typeof n === 'number' ? n : 0),
        0
      )

  return {
    vulnerabilities,
    metadata: {
      vulnerabilities: { ...vulnMeta, total },
      dependencies: {
        total:
          data.metadata.totalDependencies ||
          (typeof data.metadata.dependencies === 'number'
            ? data.metadata.dependencies
            : 0)
      }
    }
  }
}

const modifyData = async data => {
  const vulnerabilities = data.metadata.vulnerabilities || {}

  // Ensure total is present
  if (vulnerabilities.total === undefined) {
    let total = 0
    for (const [key, val] of Object.entries(vulnerabilities)) {
      if (key !== 'total' && typeof val === 'number') total += val
    }
    data.metadata.vulnerabilities.total = total
  }

  // Enrich each v2 vulnerability with pre-computed template helpers
  for (const vuln of Object.values(data.vulnerabilities || {})) {
    const directAdvisories = (vuln.via || []).filter(
      v => v && typeof v === 'object' && v.source
    )
    vuln._directAdvisories = directAdvisories
    vuln._firstAdvisory = directAdvisories[0] || null

    // For transitive vulnerabilities (via contains only string package references),
    // construct a synthetic advisory so the row is never blank.
    if (!vuln._firstAdvisory) {
      const transitiveVia = (vuln.via || []).filter(v => typeof v === 'string')
      vuln._firstAdvisory = {
        title: `${vuln.name} (affected by ${transitiveVia.join(', ')})`,
        url: null,
        cwe: [],
        overview: '',
        recommendation: '',
        references: ''
      }
      vuln._isTransitive = true
    }

    // Strip "node_modules/" prefix from each node path for readable display
    vuln._paths = (vuln.nodes || []).map(n => n.replace(/^node_modules\//, ''))
    vuln._pathsRemainder = vuln._paths.length > 1 ? vuln._paths.length - 1 : 0
  }

  data.date = Date.now()

  return data
}

export default async (data, templateFile, outputFile, theme) => {
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

    // Normalize v1 format to v2 (v2 passes through directly)
    const normalizedData = data.auditReportVersion >= 2 ? data : normalizeV1Data(data)

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
  severity =>
    severityMap[severity] ? severityMap[severity].badgeClass : 'bg-slate-500 text-white'
)

Handlebars.registerHelper('fixAvailableText', fixAvailable => fixAvailableText(fixAvailable))

Handlebars.registerHelper('safeDomId', name =>
  'pkg-' + String(name || '').replace(/[^a-zA-Z0-9]/g, '-')
)

Handlebars.registerHelper('markdown', source =>
  source ? marked.parse(source) : ''
)
