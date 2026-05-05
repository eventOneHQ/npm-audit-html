#!/usr/bin/env node

import { Command } from 'commander'
import updateNotifier from 'update-notifier'
import fs from 'fs-extra'
import open from 'open'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

import reporter from './lib/reporter.js'

const require = createRequire(import.meta.url)
const pkg = require('./package.json')
const __dirname = dirname(fileURLToPath(import.meta.url))

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
  .option('-f, --fatal-exit-code', 'exit with code 1 if vulnerabilities were found')
  .action(async (opts) => {
    try {
      let data
      if (opts.input) {
        data = await fs.readJson(opts.input)
      } else if (stdin) {
        data = JSON.parse(stdin)
      } else {
        console.log('No input')
        return process.exit(1)
      }

      await genReport(data, opts.output, opts.template, opts.theme, opts.open, opts.fatalExitCode)
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

    const templateFile = template || join(__dirname, '/templates/template.hbs')

    const modifiedData = await reporter(data, templateFile, output, theme)

    if (modifiedData.metadata.vulnerabilities.total > 0 && fatalExitCode) {
      process.exitCode = 1
    }

    console.log(`Vulnerability snapshot saved at ${output}`)

    if (openBrowser) {
      console.log('Opening report in default browser...')
      await open(resolve(output))
    }
  } catch (err) {
    console.log('An error occurred!')
    console.log(err)
    process.exit(1)
  }
}

if (process.stdin.isTTY) {
  await program.parseAsync()
} else {
  for await (const chunk of process.stdin) {
    stdin += chunk
  }
  await program.parseAsync()
}
