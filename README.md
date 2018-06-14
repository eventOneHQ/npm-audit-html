<center>
<h1>npm-audit-html</h1>

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

</center>

Generate a HTML report for NPM Audit

## Install

```bash
npm install -g npm-audit-html
```

## Usage

To generate a report, run the following:

```bash
npm audit --json | npm-audit-html
```

By default the report will be saved to `npm-audit.html`

If you want to specify the output file, add the `--output` option:

```bash
npm audit --json | npm-audit-html --output report.html
```

## License

[MIT](LICENSE)
