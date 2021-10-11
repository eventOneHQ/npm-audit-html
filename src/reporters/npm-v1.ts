import { Report, Reporter, severityMap } from '../lib/types'

export class NpmAuditReportVersion1 implements Reporter {
  public type = 'npm-v1'

  public async transformReport (data: string): Promise<Report> {
    const json = JSON.parse(data)

    let totalVulnerabilities = 0
    const vulnerabilityCounts = json.metadata.vulnerabilities || []
    for (const vul in vulnerabilityCounts) {
      const count = vulnerabilityCounts[vul]
      totalVulnerabilities += count
    }

    const report: Report = {
      createdAt: new Date(),
      overview: {
        info: json.metadata.vulnerabilities.info,
        low: json.metadata.vulnerabilities.low,
        moderate: json.metadata.vulnerabilities.moderate,
        high: json.metadata.vulnerabilities.high,
        critical: json.metadata.vulnerabilities.critical,
        totalVulnerabilities,
        totalDependencies: json.metadata.totalDependencies
      },
      vulnerabilities: []
    }

    const modules: { [key: string]: any[] } = {}

    for (const id in json.advisories) {
      const vulnerability = json.advisories[id]

      if (!modules[vulnerability.module_name]) {
        modules[vulnerability.module_name] = []
      }
      modules[vulnerability.module_name].push(vulnerability)
    }

    for (const moduleName in modules) {
      const advisories = modules[moduleName]

      let highestSeverity = 5
      let severity = 'info'
      for (const adv of advisories) {
        if (severityMap[adv.severity].number < highestSeverity) {
          highestSeverity = severityMap[adv.severity].number
          severity = adv.severity
        }
      }

      const vulnerableModule = {
        name: moduleName,
        severity,
        via: []
      }

      vulnerableModule.via = advisories.map(adv => {
        return {
          source: 1,
          name: adv.module_name,
          dependency: adv.module_name,
          title: adv.title,
          url: adv.url,
          severity: adv.severity,
          range: adv.vulnerable_versions
        }
      })

      report.vulnerabilities.push(vulnerableModule)
    }

    return report
  }

  public async isType (data: string): Promise<boolean> {
    try {
      const json = JSON.parse(data)

      return !!json?.actions
    } catch (err) {
      return false
    }
  }
}
