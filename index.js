#!/usr/bin/env node

const program = require('commander')
const reporter = require('./lib/reporter')
const pkg = require('./package.json')

program.version(pkg.version).option('-o, --output [output]', 'Output file')

const genReport = (stdin, output = 'npm-audit.html') => {
  if (!stdin) {
    console.log('No JSON')
    return process.exit(1)
  }

  let json
  try {
    json = JSON.parse(stdin)
  } catch (err) {
    console.error('Failed to parse NPM Audit JSON!')
    return process.exit(1)
  }

  const template = `${__dirname}/templates/template.hbs`
  reporter(json, template, output)
    .then(() => {
      console.log(`Vulnerability snapshot saved at ${output}`)
      process.exit(0)
    })
    .catch(err => {
      console.log('An error occurred!')
      console.log(err)
      process.exit(1)
    })
}

if (process.stdin.isTTY) {
  program.parse(process.argv)
} else {
  let stdin = ''
  process.stdin.on('readable', function () {
    const chunk = this.read()
    if (chunk !== null) {
      stdin += chunk
    }
  })
  process.stdin.on('end', function () {
    program.parse(process.argv)
    genReport(stdin, program.output)
  })
}
