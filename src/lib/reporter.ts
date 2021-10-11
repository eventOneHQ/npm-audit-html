import Handlebars from 'handlebars'
import moment from 'moment'
import marked from 'marked'
import fs from 'fs-extra'
import chalk from 'chalk'
import numeral from 'numeral'
import highlight from 'highlight.js'

import { NpmAuditReportVersion2 } from './../reporters/npm-v2'
import { NpmAuditReportVersion1 } from './../reporters/npm-v1'
import { GenerateReportOptions, Reporter, severityMap } from './types'

const generateTemplate = async (data: any, template: string) => {
  const htmlTemplate = await fs.readFile(template, 'utf8')
  return Handlebars.compile(htmlTemplate)(data)
}

const writeReport = async (report, output: string) => {
  await fs.ensureFile(output)
  await fs.writeFile(output, report)
}

const reporters: Reporter[] = [
  new NpmAuditReportVersion1(),
  new NpmAuditReportVersion2()
]

const throwError = (message: string) => {
  console.log(chalk.red(message))
  process.exit(1)
}

export const generateReport = async ({
  data,
  templateFile,
  outputFile,
  theme
}: GenerateReportOptions): Promise<any> => {
  try {
    let reporter: Reporter
    for (const r of reporters) {
      const isType = await r.isType(data)

      if (isType) {
        reporter = r
      }
    }

    if (!reporter) {
      console.log(
        chalk.red(
          `The provided data doesn't seem to be correct. Did you run with ${chalk.underline(
            'npm audit --json'
          )}?`
        )
      )
      process.exit(1)
    }

    console.log(`Transforming with ${reporter.type} reporter`)
    const modifiedData: any = await reporter.transformReport(data)

    if (!modifiedData) {
      return throwError('Something went wrong while generating the report.')
    }

    modifiedData.date = new Date()
    modifiedData.theme = theme
    const report = await generateTemplate(modifiedData, templateFile)
    await writeReport(report, outputFile)

    return modifiedData
  } catch (err) {
    return throwError(err)
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
  (severity: string) => severityMap[severity]?.color
)

Handlebars.registerHelper(
  'severityNumber',
  (severity: string) => severityMap[severity]?.number
)

Handlebars.registerHelper('markdown', source =>
  marked(source, {
    highlight: (code: string) => {
      return highlight.highlightAuto(code).value
    },
    gfm: true
  })
)
