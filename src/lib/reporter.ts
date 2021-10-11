import Handlebars from 'handlebars'
import moment from 'moment'
import fs from 'fs-extra'
import numeral from 'numeral'
import path from 'path'

import { NpmAuditReportVersion2 } from './../reporters/npm-v2'
import { NpmAuditReportVersion1 } from './../reporters/npm-v1'
import {
  GenerateReportOptions,
  Reporter,
  severityMap,
  GeneratedReport,
  Report
} from './types'

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

/**
 * Generate an HTML report for npm audit
 *
 * @param config Configuration for generating the report
 * @returns
 */
export const generateReport = async ({
  auditJson,
  templateFile = path.resolve(__dirname, '../../../templates/template.hbs'),
  outputFile = 'npm-audit.html',
  theme = 'light'
}: GenerateReportOptions): Promise<GeneratedReport> => {
  let reporter: Reporter
  for (const r of reporters) {
    const isType = await r.isType(auditJson)

    if (isType) {
      reporter = r
    }
  }

  if (!reporter) {
    throw new Error(
      "The provided data doesn't seem to be correct. Did you run with `npm audit --json`?"
    )
  }

  const reportData: Report = await reporter.transformReport(auditJson)

  if (!reportData) {
    throw new Error('Something went wrong while generating the report.')
  }

  const report = await generateTemplate(
    {
      ...reportData,
      theme
    },
    templateFile
  )
  await writeReport(report, path.resolve(outputFile))

  return {
    report: reportData,
    outputFile: path.resolve(outputFile)
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
