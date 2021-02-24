import terminalLink from 'terminal-link'
import Handlebars from 'handlebars'
import moment from 'moment'
import marked from 'marked'
import fs from 'fs-extra'
import chalk from 'chalk'
import numeral from 'numeral'
import highlight from 'highlight.js'

const severityMap: {
  [key: string]: {
    color: string
    number: number
  }
} = {
  info: {
    color: 'info',
    number: 5
  },
  low: {
    color: 'primary',
    number: 4
  },
  moderate: {
    color: 'secondary',
    number: 3
  },
  high: {
    color: 'warning',
    number: 2
  },
  critical: {
    color: 'danger',
    number: 1
  }
}

export interface ReportOverview {
  totalVulnerabilities: number
  totalDependencies: number
  critical: number
  high: number
  moderate: number
  low: number
  info: number
}
export interface Report {
  createdAt: Date
  overview: ReportOverview
  advisories: any[]
}

export interface Reporter {
  transformReport(data: any): Promise<Report>
}

export class NpmAuditReportVersion1 implements Reporter {
  async transformReport(data: any): Promise<Report> {
    return
  }
}

const generateTemplate = async (data: any, template: string) => {
  const htmlTemplate = await fs.readFile(template, 'utf8')
  return Handlebars.compile(htmlTemplate)(data)
}

const writeReport = async (report, output: string) => {
  await fs.ensureFile(output)
  await fs.writeFile(output, report)
}

const modifyData = async data => {
  const vulnerabilities = data.metadata.vulnerabilities || []

  // for (const act in data.actions) {
  //   const action = data.actions[act]
  //   console.log(action)
  // }

  // calculate totals
  let total = 0
  for (const vul in vulnerabilities) {
    const count = vulnerabilities[vul]
    total += count
  }
  data.metadata.vulnerabilities.total = total
  data.date = Date.now()

  return data
}

export interface GenerateReportOptions {
  data: any
  templateFile: string
  outputFile: string
  theme: string
}

export const generateReport = async ({
  data,
  templateFile,
  outputFile,
  theme
}: GenerateReportOptions): Promise<any> => {
  try {
    if (!data.metadata) {
      if (data.updated) {
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

    const modifiedData = await modifyData(data)
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
  (severity: string) => severityMap[severity].color
)

Handlebars.registerHelper(
  'severityNumber',
  (severity: string) => severityMap[severity].number
)

Handlebars.registerHelper('markdown', source =>
  marked(source, {
    highlight: (code: string) => {
      return highlight.highlightAuto(code).value
    },
    gfm: true
  })
)
