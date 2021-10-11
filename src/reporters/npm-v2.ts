import { Report, Reporter } from '../lib/types'

export class NpmAuditReportVersion2 implements Reporter {
  public type = 'npm-v2'

  public async transformReport (data: string): Promise<Report> {
    let json = JSON.parse(data)

    // if the report is generated with `npm audit fix --json`, the report will be in an `audit` sub-object
    if (json.audit) {
      json = json.audit
    }

    const report: Report = {
      createdAt: new Date(),
      overview: {
        info: json.metadata.vulnerabilities.info,
        low: json.metadata.vulnerabilities.low,
        moderate: json.metadata.vulnerabilities.moderate,
        high: json.metadata.vulnerabilities.high,
        critical: json.metadata.vulnerabilities.critical,
        totalVulnerabilities: json.metadata.vulnerabilities.total,
        totalDependencies: json.metadata.dependencies.total
      },
      vulnerabilities: []
    }

    for (const name in json.vulnerabilities) {
      const vulnerability = json.vulnerabilities[name]

      report.vulnerabilities.push({
        name: vulnerability.name,
        severity: vulnerability.severity,
        via: vulnerability.via
      })
    }

    return report
  }

  public async isType (data: string): Promise<boolean> {
    try {
      const json = JSON.parse(data)

      return (
        json?.auditReportVersion === 2 || json?.audit?.auditReportVersion === 2
      )
    } catch (err) {
      return false
    }
  }
}
