<h1 align="center">npm-audit-html</h1>

<p align="center">
<a href="http://commitizen.github.io/cz-cli/"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly"></a>
<a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="JavaScript Style Guide"></a>
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
