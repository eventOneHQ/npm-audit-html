#!/usr/bin/env node

const program = require('commander')
const updateNotifier = require('update-notifier')
const fs = require('fs-extra')
const open = require('open')
const path = require('path')

const reporter = require('./lib/reporter')
const pkg = require('./package.json')

updateNotifier({ pkg }).notify()

let stdin = ''

program
  .version(pkg.version)
  .option('-o, --output [output]', 'output file')
  .option('-i, --input [input]', 'input file')
  .option('-O, --open', 'open report in default browser automatically')
  .option(
    '-c, --theme [theme name]',
    'template theme `dark` or `light` (defaults to `light`)'
  )
  .option('-t, --template [handlebars file]', 'handlebars template file')
  .option('-f, --fatal-exit-code', 'exit with code 1 if vulnerabilities were found')
  .action(async (cmd, env) => {
    try {
      let data
      if (cmd.input) {
        data = await fs.readJson(cmd.input)
      } else if (stdin) {
        data = JSON.parse(stdin)
      } else {
        console.log('No input')
        return process.exit(1)
      }

      await genReport(data, cmd.output, cmd.template, cmd.theme, cmd.open, cmd.fatalExitCode)
    } catch (err) {
      console.error('Failed to parse NPM Audit JSON!')
      return process.exit(1)
    }
  })

const genReport = async (
  data,
  output = 'npm-audit.html',
  template,
  theme = 'light',
  openBrowser = false,
  fatalExitCode = false
) => {
  try {
    if (!data) {
      console.log('No JSON')
      return process.exit(1)
    }

    const templateFile = template || path.join(__dirname, '/templates/template.hbs')

    const modifiedData = await reporter(data, templateFile, output, theme)

    if (modifiedData.metadata.vulnerabilities.total > 0 && fatalExitCode) {
      process.exitCode = 1
    }

    console.log(`Vulnerability snapshot saved at ${output}`)

    if (openBrowser) {
      console.log('Opening report in default browser...')
      await open(path.resolve(output))
    }
  } catch (err) {
    console.log('An error occurred!')
    console.log(err)
    process.exit(1)
  }
}

if (process.stdin.isTTY) {
  program.parse(process.argv)
} else {
  process.stdin.on('readable', function () {
    const chunk = this.read()
    if (chunk !== null) {
      stdin += chunk
    }
  })
  process.stdin.on('end', function () {
    program.parse(process.argv)
  })
}
