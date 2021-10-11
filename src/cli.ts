#!/usr/bin/env node
import { Command } from 'commander'
import updateNotifier from 'update-notifier'

import fs from 'fs-extra'
import open from 'open'

import { generateReport } from './lib/reporter'
import pkg from '../package.json'
import chalk from 'chalk'

updateNotifier({ pkg }).notify()

let stdin = ''

const program = new Command()

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
  .option(
    '-f, --fatal-exit-code',
    'exit with code 1 if vulnerabilities were found'
  )
  .action(async cmd => {
    try {
      let data: string
      if (cmd.input) {
        const file = await fs.readFile(cmd.input)
        data = file.toString('utf-8')
      } else if (stdin) {
        data = stdin
      }

      if (!data) {
        console.log(chalk.red('No input'))
        return process.exit(1)
      }

      await genReport(
        data,
        cmd.output,
        cmd.template,
        cmd.theme,
        cmd.open,
        cmd.fatalExitCode
      )
    } catch (err) {
      console.log(chalk.red('Failed to parse NPM Audit JSON!'))
      return process.exit(1)
    }
  })

const genReport = async (
  data: any,
  outputFile,
  template: string,
  theme,
  openBrowser = false,
  fatalExitCode = false
) => {
  try {
    if (!data) {
      console.log(chalk.red('No JSON'))
      return process.exit(1)
    }

    const res = await generateReport({
      auditJson: data,
      templateFile: template,
      outputFile,
      theme
    })

    if (fatalExitCode && res?.report?.overview?.totalVulnerabilities > 0) {
      process.exitCode = 1
    }

    console.log(`Vulnerability snapshot saved at ${res.outputFile}`)

    if (openBrowser) {
      console.log('Opening report in default browser...')
      await open(res.outputFile)
    }
  } catch (err) {
    console.log(chalk.red(err))
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
