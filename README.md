<h1 align="center">npm-audit-html</h1>

<p align="center">
<a href="https://github.com/eventOneHQ/npm-audit-html/blob/master/LICENSE"><img src="https://img.shields.io/github/license/eventOneHQ/npm-audit-html.svg" alt="GitHub license"></a>
<a href="https://www.npmjs.com/package/npm-audit-html"><img src="https://img.shields.io/npm/v/npm-audit-html.svg" alt="npm"></a>
<a href="https://github.com/eventOneHQ/npm-audit-html/actions/workflows/nodejs.yml"><img src="https://github.com/eventOneHQ/npm-audit-html/actions/workflows/nodejs.yml/badge.svg" alt="Node CI"></a>
<a href="http://commitizen.github.io/cz-cli/"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly"></a>
<a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="JavaScript Style Guide"></a>
<a href="https://github.com/semantic-release/semantic-release"><img src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg" alt="semantic-release"></a>

</p>
<p align="center"><b>Generate a HTML report for NPM Audit</b></p>

## 📝 Table of Contents

- [Getting Started](#getting_started)
- [Usage](#usage)
- [Contributing](CONTRIBUTING.md)
- [Authors](#authors)
- [Acknowledgments](#acknowledgement)

## 🏁 Getting Started <a name = "getting_started"></a>

```
$ npm install -g npm-audit-html
```

> This package uses async/await and requires Node.js 7.6

## 🎈 Usage <a name="usage"></a>

To generate a report, run the following:

```
$ npm audit --json | npm-audit-html
```

By default the report will be saved to `npm-audit.html`

If you want to specify the output file, add the `--output` option:

```bash
npm audit --json | npm-audit-html --output report.html
```

You can also fully customize the generated report by providing `--template` option followed by your own handlebars template: 

```bash
npm audit --json | npm-audit-html --template ./my-awesome-template.hbs
```

If you'd like the generator to exit with non-zero exit code when vulnerabilities are found, you can add the `--fatal-exit-code` option:
```bash
npm audit --json | npm-audit-html --fatal-exit-code
```

## ✍️ Authors <a name = "authors"></a>

- [@nprail](https://github.com/nprail) - Maintainer

See also the list of [contributors](https://github.com/eventOneHQ/npm-audit-html/contributors) who participated in this project.

## 🎉 Acknowledgements <a name = "acknowledgement"></a>

- Hat tip to anyone whose code was used

## License

[MIT](LICENSE)
