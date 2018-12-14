const Handlebars = require('handlebars')
const moment = require('moment')
const marked = require('marked')
const fse = require('fs-extra')
const fs = require('fs')
const { promisify } = require('util')

const bootstrapClassSeverityMap = {
  low: 'primary',
  moderate: 'secondary',
  high: 'warning',
  critical: 'danger'
}

const generateTemplate = async (data, template) => {
  try {
    const readFile = promisify(fs.readFile)
    const htmlTemplate = await readFile(template, 'utf8')
    return Handlebars.compile(htmlTemplate)(data)
  } catch (err) {
    throw err
  }
}

const writeReport = async (report, output) => {
  try {
    const writeFile = promisify(fs.writeFile)
    await fse.ensureFile(output)
    await writeFile(output, report)
  } catch (err) {
    throw err
  }
}

const modifyData = async data => {
  const vulnerabilities = data.metadata.vulnerabilities || []

  //   for (const act in data.actions) {
  //     const action = data.actions[act]
  //     console.log(action)
  //   }

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

module.exports = async (data, templateFile, outputFile) => {
  try {
    const modifiedData = await modifyData(data)
    const report = await generateTemplate(modifiedData, templateFile)
    await writeReport(report, outputFile)
  } catch (err) {
    console.log(err)
  }
}

Handlebars.registerHelper('moment', (date, format) => {
  return moment.utc(date).format(format)
})

Handlebars.registerHelper('severityClass', severity => {
  const bootstrapClass = bootstrapClassSeverityMap[severity]
  return bootstrapClass
})

Handlebars.registerHelper('markdown', source => {
  return marked(source)
})
