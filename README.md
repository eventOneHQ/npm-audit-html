<h1 align="center">npm-audit-html</h1>

<p align="center">
<a href="https://github.com/Filiosoft/npm-audit-html/blob/master/LICENSE"><img src="https://img.shields.io/github/license/Filiosoft/npm-audit-html.svg" alt="GitHub license"></a>
<a href="https://www.npmjs.com/package/npm-audit-html"><img src="https://img.shields.io/npm/v/npm-audit-html.svg" alt="npm"></a>
<a href="https://travis-ci.com/Filiosoft/npm-audit-html"><img src="https://travis-ci.com/Filiosoft/npm-audit-html.svg?branch=master" alt="Build Status"></a>
<a href="http://commitizen.github.io/cz-cli/"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly"></a>
<a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="JavaScript Style Guide"></a>
<a href="https://github.com/semantic-release/semantic-release"><img src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg" alt="semantic-release"></a>

</p>
<p align="center"><b>Generate a HTML report for NPM Audit</b></p>

## Install

```
$ npm install -g npm-audit-html
```

> This package uses async/await and requires Node.js 7.6

## Usage

To generate a report, run the following:

```
$ npm audit --json | npm-audit-html
```

By default the report will be saved to `npm-audit.html`

If you want to specify the output file, add the `--output` option:

```bash
npm audit --json | npm-audit-html --output report.html
```

## License

[MIT](LICENSE)
