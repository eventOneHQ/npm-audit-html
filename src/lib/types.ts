export interface GenerateReportOptions {
  data: string
  templateFile: string
  outputFile: string
  theme: string
}

export interface ReportOverview {
  totalVulnerabilities: number
  totalDependencies: number
  critical: number
  high: number
  moderate: number
  low: number
  info: number
}

export interface ReportVulnerability {
  source: number
  name: string
  dependency: string
  title: string
  url: string
  severity: string
  range: string
}
export interface ReportVulnerabilityFix {
  name: string
  version: string
  isSemVerMajor: boolean
}
export interface ReportVulnerabilityModule {
  name: string
  severity: string
  via: ReportVulnerability | ReportVulnerability[]
}
export interface Report {
  createdAt: Date
  overview: ReportOverview
  vulnerabilities: ReportVulnerabilityModule[]
}

export interface Reporter {
  type: string
  transformReport(data: string): Promise<Report>
  isType(data: string): Promise<boolean>
}

export const severityMap: {
  [key: string]: {
    color: string
    number: number
  }
} = {
  info: {
    color: 'info',
    number: 5
  },
  low: {
    color: 'primary',
    number: 4
  },
  moderate: {
    color: 'secondary',
    number: 3
  },
  high: {
    color: 'warning',
    number: 2
  },
  critical: {
    color: 'danger',
    number: 1
  }
}
