/**
 * Anonymised hardcoded data for marketing showcase components.
 *
 * All company names, locations, and metrics are fictional.
 * Data tells a positive growth story suitable for marketing.
 */

// ─── Portfolio Overview (Homepage Bento 1 + Features Hero + Leadership) ──────

export const portfolioKPIs = [
  {
    label: 'Total MRR',
    tooltip: 'Monthly recurring revenue across all locations',
    value: '£287,450',
    numericValue: 287450,
    prefix: '£',
    trend: { delta: 4.2, isPercentage: true, comparisonPeriod: 'MoM' as const, direction: 'up' as const, sentiment: 'positive' as const },
  },
  {
    label: 'Occupancy',
    tooltip: 'Occupied desks as a percentage of total capacity',
    value: '87.3%',
    numericValue: 87.3,
    suffix: '%',
    trend: { delta: 2.1, isPercentage: true, comparisonPeriod: 'MoM' as const, direction: 'up' as const, sentiment: 'positive' as const },
  },
  {
    label: 'Active Clients',
    tooltip: 'Number of clients with active contracts',
    value: '342',
    numericValue: 342,
    trend: { delta: 12, isPercentage: false, comparisonPeriod: 'MoM' as const, direction: 'up' as const, sentiment: 'positive' as const },
  },
  {
    label: 'Revenue at Risk',
    tooltip: 'MRR from clients with upcoming breaks or churn signals',
    value: '£18,200',
    numericValue: 18200,
    prefix: '£',
    trend: { delta: -15.3, isPercentage: true, comparisonPeriod: 'MoM' as const, direction: 'down' as const, sentiment: 'positive' as const },
  },
];

export const portfolioMRRTrend = [
  { name: 'Apr', value: '228000' },
  { name: 'May', value: '234000' },
  { name: 'Jun', value: '241000' },
  { name: 'Jul', value: '248000' },
  { name: 'Aug', value: '252000' },
  { name: 'Sep', value: '259000' },
  { name: 'Oct', value: '264000' },
  { name: 'Nov', value: '268000' },
  { name: 'Dec', value: '273000' },
  { name: 'Jan', value: '278000' },
  { name: 'Feb', value: '282000' },
  { name: 'Mar', value: '287000' },
];

// ─── Revenue Waterfall (Homepage Bento 2) ────────────────────────────────────

export const waterfallData = [
  { name: 'Opening', value: 245000, fill: 'hsl(var(--chart-1))' },
  { name: 'New', value: 28400, fill: 'hsl(var(--chart-5))' },
  { name: 'Expansion', value: 18600, fill: 'hsl(var(--chart-3))' },
  { name: 'Contraction', value: -2800, fill: 'hsl(var(--chart-4))' },
  { name: 'Churn', value: -1750, fill: 'hsl(var(--chart-2))' },
  { name: 'Closing', value: 287450, fill: 'hsl(var(--chart-1))' },
];

// ─── Risk Overview (Homepage Bento 3) ────────────────────────────────────────

export const riskSignals = [
  {
    company: 'Acme Corp',
    level: 'danger' as const,
    signal: 'Break in 30 days',
    delta: -4200,
    mrrImpact: '£4,200/mo',
    action: 'Schedule retention meeting this week',
  },
  {
    company: 'Globex Inc',
    level: 'warning' as const,
    signal: 'Usage declining',
    delta: -18,
    mrrImpact: '-18% MoM',
    action: 'Review space utilisation & reach out',
  },
  {
    company: 'Initech',
    level: 'healthy' as const,
    signal: 'Expanding',
    delta: 1800,
    mrrImpact: '+£1,800/mo',
    action: 'Propose upsell to larger office',
  },
];

export const riskTreemapData = [
  { name: 'Acme Corp', mrr: 4200, riskScore: 28, signals: ['Break notice'] },
  { name: 'Globex Inc', mrr: 3100, riskScore: 42, signals: ['Usage drop'] },
  { name: 'Stark Industries', mrr: 2800, riskScore: 55, signals: ['Late payments'] },
  { name: 'Wayne Enterprises', mrr: 1950, riskScore: 35, signals: ['NPS decline'] },
  { name: 'Umbrella Corp', mrr: 6200, riskScore: 72, signals: [] },
  { name: 'Initech', mrr: 5400, riskScore: 85, signals: [] },
  { name: 'Hooli', mrr: 3800, riskScore: 78, signals: [] },
  { name: 'Pied Piper', mrr: 2600, riskScore: 91, signals: [] },
];

export const riskKPIs = [
  { label: 'Revenue at Risk', value: '£18,200', delta: '-15.3%', sentiment: 'positive' as const },
  { label: 'Upcoming Breaks', value: '8', delta: '-2', sentiment: 'positive' as const },
  { label: 'Overdue Invoices', value: '3', delta: '-1', sentiment: 'positive' as const },
  { label: 'Avg Health Score', value: '72', delta: '+4', sentiment: 'positive' as const },
];

export const riskTimeline = [
  { month: 'Apr', atRisk: 22400, mitigated: 4200 },
  { month: 'May', atRisk: 19800, mitigated: 6100 },
  { month: 'Jun', atRisk: 18200, mitigated: 7800 },
  { month: 'Jul', atRisk: 16500, mitigated: 9200 },
  { month: 'Aug', atRisk: 15100, mitigated: 10400 },
  { month: 'Sep', atRisk: 13800, mitigated: 11600 },
];

export const renewalPipeline = [
  { company: 'Acme Corp', mrr: '£4,200', breakDate: '28 Apr', health: 32, status: 'Critical' as const },
  { company: 'Stark Industries', mrr: '£2,800', breakDate: '15 May', health: 55, status: 'Watch' as const },
  { company: 'Wayne Enterprises', mrr: '£1,950', breakDate: '02 Jun', health: 35, status: 'Watch' as const },
  { company: 'Globex Inc', mrr: '£3,100', breakDate: '18 Jul', health: 42, status: 'Watch' as const },
  { company: 'Umbrella Corp', mrr: '£6,200', breakDate: '30 Aug', health: 72, status: 'Stable' as const },
  { company: 'Hooli', mrr: '£3,800', breakDate: '12 Sep', health: 78, status: 'Stable' as const },
  { company: 'Pied Piper', mrr: '£2,600', breakDate: '25 Oct', health: 91, status: 'Stable' as const },
  { company: 'Initech', mrr: '£5,400', breakDate: '08 Nov', health: 64, status: 'Watch' as const },
];

// ─── Pipeline (Homepage Bento 4 + Features Pipeline) ─────────────────────────

export const pipelineSimple = [
  { label: 'Hot Desks', available: 18, pipeline: 12 },
  { label: '1-5 Desks', available: 8, pipeline: 6 },
  { label: '6-10 Desks', available: 5, pipeline: 4 },
];

export const pipelineDetailed = {
  thisMonth: [
    { label: 'Hot Desks', available: 18, opportunities: 12, leads: 4 },
    { label: 'Dedicated', available: 6, opportunities: 3, leads: 2 },
    { label: '1-5 Desks', available: 8, opportunities: 6, leads: 3 },
    { label: '6-10 Desks', available: 5, opportunities: 4, leads: 1 },
    { label: '11-15 Desks', available: 3, opportunities: 2, leads: 1 },
  ],
  oneToThreeMonths: [
    { label: 'Hot Desks', available: 22, opportunities: 8, leads: 6 },
    { label: 'Dedicated', available: 9, opportunities: 4, leads: 3 },
    { label: '1-5 Desks', available: 11, opportunities: 7, leads: 4 },
    { label: '6-10 Desks', available: 7, opportunities: 3, leads: 2 },
    { label: '11-15 Desks', available: 4, opportunities: 1, leads: 2 },
  ],
  threeToSixMonths: [
    { label: 'Hot Desks', available: 26, opportunities: 5, leads: 8 },
    { label: 'Dedicated', available: 12, opportunities: 2, leads: 5 },
    { label: '1-5 Desks', available: 14, opportunities: 4, leads: 6 },
    { label: '6-10 Desks', available: 9, opportunities: 2, leads: 3 },
    { label: '11-15 Desks', available: 5, opportunities: 1, leads: 3 },
  ],
};

export const pipelineSummaries = {
  thisMonth: { units: 40, deals: 27, leads: 11 },
  oneToThreeMonths: { units: 53, deals: 23, leads: 17 },
  threeToSixMonths: { units: 66, deals: 14, leads: 25 },
};

// ─── Efficiency (Features Page) ──────────────────────────────────────────────

export const efficiencyKPIs = [
  { label: 'Reports Generated', value: '47/mo', badge: 'Automated', badgeVariant: 'success' as const },
  { label: 'Time Saved', value: '8.2%', delta: 3.1 },
  { label: 'Manual Tasks Eliminated', value: '312', subtext: 'This Quarter' },
];

export const efficiencyTrend = [
  { month: 'Oct', manual: 42, automated: 12 },
  { month: 'Nov', manual: 38, automated: 18 },
  { month: 'Dec', manual: 35, automated: 22 },
  { month: 'Jan', manual: 30, automated: 28 },
  { month: 'Feb', manual: 26, automated: 34 },
  { month: 'Mar', manual: 22, automated: 40 },
];

export const efficiencyDashKPIs = [
  { label: 'Time Saved', value: '8.2%', delta: '+3.1%', sentiment: 'positive' as const },
  { label: 'Reports Auto-Generated', value: '47/mo', delta: '+12', sentiment: 'positive' as const },
  { label: 'Manual Tasks Eliminated', value: '312', delta: '+84', sentiment: 'positive' as const },
  { label: 'Data Sync Accuracy', value: '99.4%', delta: '+0.6%', sentiment: 'positive' as const },
];

export const automationLog = [
  { task: 'Weekly occupancy report', type: 'Report', saved: '2.5 hrs', status: 'Completed' as const, time: '08:00' },
  { task: 'Invoice reconciliation', type: 'Sync', saved: '1.8 hrs', status: 'Completed' as const, time: '09:15' },
  { task: 'Pipeline summary email', type: 'Report', saved: '45 min', status: 'Completed' as const, time: '10:30' },
  { task: 'Member check-in alerts', type: 'Workflow', saved: '30 min', status: 'Running' as const, time: '11:00' },
  { task: 'Board pack generation', type: 'Report', saved: '4.2 hrs', status: 'Scheduled' as const, time: '14:00' },
  { task: 'Revenue forecast refresh', type: 'Sync', saved: '1.2 hrs', status: 'Scheduled' as const, time: '15:30' },
  { task: 'Client health scoring', type: 'Workflow', saved: '55 min', status: 'Scheduled' as const, time: '17:00' },
];

// ─── Sales Showcase (Solutions > Sales) ──────────────────────────────────────

export const salesCycleData = [
  { unitType: 'Hot Desk', avgDays: 8 },
  { unitType: 'Dedicated', avgDays: 14 },
  { unitType: '1-5 Desks', avgDays: 22 },
  { unitType: '6-10 Desks', avgDays: 34 },
  { unitType: '11-15 Desks', avgDays: 48 },
  { unitType: '16+ Desks', avgDays: 62 },
];

export const leadSourceData = [
  { source: 'Website', won: 24, active: 18, lost: 8 },
  { source: 'Referral', won: 16, active: 12, lost: 4 },
  { source: 'Broker', won: 12, active: 22, lost: 10 },
  { source: 'Direct', won: 8, active: 6, lost: 3 },
];

export const salesKPIs = [
  { label: 'Avg. Days to Close', value: '34', numericValue: 34, delta: -12, sentiment: 'positive' as const },
  { label: 'Win Rate', value: '42%', numericValue: 42, suffix: '%', delta: 5.8, sentiment: 'positive' as const },
];

// ─── Operations Showcase (Solutions > Operations) ────────────────────────────

export const operationsKPIs = [
  {
    label: 'Occupancy',
    tooltip: 'Percentage of desks under active contract',
    value: '87.3%',
    numericValue: 87.3,
    suffix: '%',
    variant: 'success' as const,
    trend: { delta: 2.1, isPercentage: true, comparisonPeriod: 'MoM' as const, direction: 'up' as const, sentiment: 'positive' as const },
  },
  {
    label: 'Utilisation',
    tooltip: 'Average desk usage based on WiFi and booking data',
    value: '72.1%',
    numericValue: 72.1,
    suffix: '%',
    variant: 'warning' as const,
    trend: { delta: 1.8, isPercentage: true, comparisonPeriod: 'MoM' as const, direction: 'up' as const, sentiment: 'positive' as const },
  },
  {
    label: 'Upcoming Breaks',
    tooltip: 'Contracts with break clauses in the next 90 days',
    value: '8',
    numericValue: 8,
    variant: 'default' as const,
    trend: { delta: -2, isPercentage: false, comparisonPeriod: 'MoM' as const, direction: 'down' as const, sentiment: 'positive' as const },
  },
  {
    label: 'NPS Score',
    tooltip: 'Net Promoter Score from latest member survey',
    value: '64',
    numericValue: 64,
    variant: 'success' as const,
    trend: { delta: 4, isPercentage: false, comparisonPeriod: 'MoM' as const, direction: 'up' as const, sentiment: 'positive' as const },
  },
];

export const occupancyVsUtilisation = [
  { month: 'Apr', occupancy: 78.2, utilisation: 62.4 },
  { month: 'May', occupancy: 79.8, utilisation: 63.1 },
  { month: 'Jun', occupancy: 80.5, utilisation: 64.8 },
  { month: 'Jul', occupancy: 81.2, utilisation: 65.2 },
  { month: 'Aug', occupancy: 82.8, utilisation: 66.9 },
  { month: 'Sep', occupancy: 83.5, utilisation: 67.4 },
  { month: 'Oct', occupancy: 84.1, utilisation: 68.2 },
  { month: 'Nov', occupancy: 85.2, utilisation: 69.5 },
  { month: 'Dec', occupancy: 85.8, utilisation: 70.1 },
  { month: 'Jan', occupancy: 86.1, utilisation: 70.8 },
  { month: 'Feb', occupancy: 86.9, utilisation: 71.5 },
  { month: 'Mar', occupancy: 87.3, utilisation: 72.1 },
];

// ─── Leadership Showcase (Solutions > Leadership) ────────────────────────────

export const leadershipKPIs = [
  { label: 'Total MRR', value: '£287,450', numericValue: 287450, prefix: '£', delta: 4.2 },
  { label: 'Occupancy', value: '87.3%', numericValue: 87.3, suffix: '%', delta: 2.1 },
  { label: 'Net Retention', value: '104.8%', numericValue: 104.8, suffix: '%', delta: 1.2 },
  { label: 'Revenue at Risk', value: '£18,200', numericValue: 18200, prefix: '£', delta: -15.3, invert: true },
  { label: 'Pipeline Coverage', value: '2.4x', numericValue: 2.4, suffix: 'x', delta: 0.3 },
];

export const quarterlyMRR = [
  { quarter: 'Q1 24', actual: 228000, target: 235000 },
  { quarter: 'Q2 24', actual: 248000, target: 250000 },
  { quarter: 'Q3 24', actual: 268000, target: 265000 },
  { quarter: 'Q4 24', actual: 287000, target: 280000 },
];

export const locationStatuses: { name: string; level: 'healthy' | 'warning' | 'danger' }[] = [
  { name: 'Kings Cross', level: 'healthy' as const },
  { name: 'Shoreditch', level: 'healthy' as const },
  { name: 'Manchester', level: 'warning' as const },
  { name: 'Bristol', level: 'healthy' as const },
  { name: 'Edinburgh', level: 'healthy' as const },
  { name: 'Birmingham', level: 'warning' as const },
  { name: 'Leeds', level: 'healthy' as const },
  { name: 'Cambridge', level: 'healthy' as const },
];

// ─── Multi-Role Showcase (Solutions Hero) ────────────────────────────────────

export const miniRoles = {
  sales: {
    label: 'Sales',
    kpi: '12 Active Deals',
    bars: [
      { name: '1-5', available: 8, pipeline: 6 },
      { name: '6-10', available: 5, pipeline: 4 },
    ],
  },
  operations: {
    label: 'Operations',
    kpi: '87% Occupancy',
    percentage: 87,
  },
  finance: {
    label: 'Finance',
    kpi: '£287k MRR',
    trend: [228, 241, 252, 264, 278, 287],
  },
  leadership: {
    label: 'Leadership',
    kpis: [
      { label: 'Revenue', value: '£287k' },
      { label: 'Occupancy', value: '87%' },
      { label: 'NPS', value: '64' },
    ],
  },
};

// ─── Case Studies Showcase ───────────────────────────────────────────────────

export const beforeAfter = {
  before: [
    { label: 'Occupancy', value: '67%', numericValue: 67 },
    { label: 'MRR', value: '£180k', numericValue: 180000 },
    { label: 'Reporting', value: 'Manual', numericValue: 0 },
  ],
  after: [
    { label: 'Occupancy', value: '87%', numericValue: 87 },
    { label: 'MRR', value: '£287k', numericValue: 287000 },
    { label: 'Reporting', value: 'Automated', numericValue: 100 },
  ],
};

export const caseStudyThumbnails = [
  {
    company: 'Huckletree',
    metric: '+15%',
    label: 'Revenue Growth',
    sparkline: [82, 85, 84, 88, 90, 92, 94, 97],
  },
  {
    company: 'Patch',
    metric: '3x',
    label: 'Faster Reporting',
    sparkline: [40, 38, 30, 22, 18, 14, 12, 10],
  },
  {
    company: 'Koho',
    metric: '87%',
    label: 'Occupancy',
    sparkline: [72, 74, 76, 78, 80, 83, 85, 87],
  },
];

// ─── Single Source of Truth (Features > Single Source) ────────────────────────

export const dataSources = [
  { name: 'Nexudus', type: 'Workspace', color: 'hsl(var(--chart-1))', records: '12,480' },
  { name: 'HubSpot', type: 'CRM', color: 'hsl(var(--chart-3))', records: '8,342' },
  { name: 'Xero', type: 'Finance', color: 'hsl(var(--chart-5))', records: '26,910' },
];

export const dataFeedItems = [
  { source: 'Nexudus', event: 'Contract renewed', detail: 'Acme Corp — 12 desks', time: '2s ago' },
  { source: 'HubSpot', event: 'Deal moved to Won', detail: 'Globex Inc — 6 desks', time: '18s ago' },
  { source: 'Xero', event: 'Invoice paid', detail: 'Initech — £3,800', time: '45s ago' },
  { source: 'Nexudus', event: 'New member check-in', detail: 'Wayne Enterprises', time: '1m ago' },
  { source: 'HubSpot', event: 'Lead created', detail: 'Pied Piper — Hot Desk', time: '2m ago' },
  { source: 'Xero', event: 'Payment overdue', detail: 'Stark Industries — £1,200', time: '3m ago' },
];

export const unifiedMetrics = [
  { label: 'Total Records', value: '47,832' },
  { label: 'Sources Connected', value: '6' },
  { label: 'Last Sync', value: '2 min ago' },
  { label: 'Data Health', value: '99.2%' },
];

// ─── Forecasting & Planning (Features > Forecasting) ─────────────────────────

export const forecastData = {
  base: [
    { month: 'Jan', actual: 278000, forecast: 278000 },
    { month: 'Feb', actual: 282000, forecast: 282000 },
    { month: 'Mar', actual: 287000, forecast: 287000 },
    { month: 'Apr', actual: null, forecast: 293000 },
    { month: 'May', actual: null, forecast: 298000 },
    { month: 'Jun', actual: null, forecast: 304000 },
    { month: 'Jul', actual: null, forecast: 309000 },
    { month: 'Aug', actual: null, forecast: 314000 },
    { month: 'Sep', actual: null, forecast: 318000 },
  ],
  optimistic: [
    { month: 'Jan', actual: 278000, forecast: 278000 },
    { month: 'Feb', actual: 282000, forecast: 282000 },
    { month: 'Mar', actual: 287000, forecast: 287000 },
    { month: 'Apr', actual: null, forecast: 296000 },
    { month: 'May', actual: null, forecast: 306000 },
    { month: 'Jun', actual: null, forecast: 316000 },
    { month: 'Jul', actual: null, forecast: 326000 },
    { month: 'Aug', actual: null, forecast: 336000 },
    { month: 'Sep', actual: null, forecast: 345000 },
  ],
  conservative: [
    { month: 'Jan', actual: 278000, forecast: 278000 },
    { month: 'Feb', actual: 282000, forecast: 282000 },
    { month: 'Mar', actual: 287000, forecast: 287000 },
    { month: 'Apr', actual: null, forecast: 289000 },
    { month: 'May', actual: null, forecast: 291000 },
    { month: 'Jun', actual: null, forecast: 294000 },
    { month: 'Jul', actual: null, forecast: 296000 },
    { month: 'Aug', actual: null, forecast: 298000 },
    { month: 'Sep', actual: null, forecast: 301000 },
  ],
};

export const forecastSummaries: Record<string, { projected: string; growth: string; occupancy: string }> = {
  base: { projected: '£318k', growth: '+10.8%', occupancy: '91%' },
  optimistic: { projected: '£345k', growth: '+20.2%', occupancy: '95%' },
  conservative: { projected: '£301k', growth: '+4.9%', occupancy: '89%' },
};

export const forecastLocationBreakdown = [
  { location: 'Kings Cross', currentMRR: 98000, forecastMRR: 112000, occupancy: 91, forecastOcc: 94, status: 'On Track' as const },
  { location: 'Shoreditch', currentMRR: 82000, forecastMRR: 91000, occupancy: 88, forecastOcc: 92, status: 'On Track' as const },
  { location: 'Manchester', currentMRR: 64000, forecastMRR: 68000, occupancy: 79, forecastOcc: 83, status: 'At Risk' as const },
  { location: 'Bristol', currentMRR: 43000, forecastMRR: 47000, occupancy: 84, forecastOcc: 88, status: 'On Track' as const },
  { location: 'Edinburgh', currentMRR: 38000, forecastMRR: 44000, occupancy: 82, forecastOcc: 87, status: 'On Track' as const },
  { location: 'Birmingham', currentMRR: 52000, forecastMRR: 55000, occupancy: 76, forecastOcc: 81, status: 'At Risk' as const },
  { location: 'Leeds', currentMRR: 35000, forecastMRR: 40000, occupancy: 80, forecastOcc: 85, status: 'On Track' as const },
  { location: 'Cambridge', currentMRR: 28000, forecastMRR: 33000, occupancy: 86, forecastOcc: 90, status: 'On Track' as const },
];

export const budgetVariance = [
  { category: 'Revenue', budget: 285000, actual: 287450, variance: 0.9 },
  { category: 'OpEx', budget: 142000, actual: 138200, variance: -2.7 },
  { category: 'CapEx', budget: 45000, actual: 42800, variance: -4.9 },
  { category: 'Net Margin', budget: 98000, actual: 106450, variance: 8.6 },
];

// ─── Community Showcase (Solutions > Community) ──────────────────────────────

export const communityKPIs = [
  { label: 'Member Health', value: '72', delta: '+4', sentiment: 'positive' as const },
  { label: 'Renewals (90d)', value: '24', delta: '+3', sentiment: 'positive' as const },
  { label: 'Churn Rate', value: '3.2%', delta: '-1.1%', sentiment: 'positive' as const },
  { label: 'NPS Score', value: '64', delta: '+6', sentiment: 'positive' as const },
];

export const memberHealthDistribution = [
  { band: 'Thriving', count: 186, pct: 54 },
  { band: 'Steady', count: 108, pct: 32 },
  { band: 'At Risk', count: 34, pct: 10 },
  { band: 'Critical', count: 14, pct: 4 },
];

export const memberHealthTrend = [
  { month: 'Oct', healthy: 168, steady: 112, atRisk: 42, critical: 20 },
  { month: 'Nov', healthy: 172, steady: 110, atRisk: 40, critical: 18 },
  { month: 'Dec', healthy: 176, steady: 108, atRisk: 38, critical: 16 },
  { month: 'Jan', healthy: 180, steady: 108, atRisk: 36, critical: 16 },
  { month: 'Feb', healthy: 183, steady: 108, atRisk: 35, critical: 15 },
  { month: 'Mar', healthy: 186, steady: 108, atRisk: 34, critical: 14 },
];

export const upcomingRenewals = [
  { company: 'Acme Corp', mrr: '£4,200', renewDate: '28 Apr', health: 32, action: 'Retention call' },
  { company: 'Globex Inc', mrr: '£3,100', renewDate: '15 May', health: 68, action: 'Standard check-in' },
  { company: 'Wayne Enterprises', mrr: '£1,950', renewDate: '02 Jun', health: 45, action: 'Community event invite' },
  { company: 'Pied Piper', mrr: '£2,600', renewDate: '18 Jun', health: 82, action: 'Upsell conversation' },
  { company: 'Hooli', mrr: '£3,800', renewDate: '30 Jul', health: 78, action: 'Standard renewal' },
  { company: 'Stark Industries', mrr: '£2,800', renewDate: '14 Aug', health: 55, action: 'Retention call' },
  { company: 'Umbrella Corp', mrr: '£6,200', renewDate: '02 Sep', health: 72, action: 'Expansion discussion' },
  { company: 'Initech', mrr: '£5,400', renewDate: '20 Sep', health: 85, action: 'Standard renewal' },
];

// ─── Finance Showcase (Solutions > Finance) ──────────────────────────────────

export const financeKPIs = [
  { label: 'Total MRR', value: '£287,450', delta: '+4.2%', sentiment: 'positive' as const },
  { label: 'Cash Collection', value: '96.8%', delta: '+1.2%', sentiment: 'positive' as const },
  { label: 'Overdue AR', value: '£8,400', delta: '-22%', sentiment: 'positive' as const },
  { label: 'Net Margin', value: '37.1%', delta: '+2.4%', sentiment: 'positive' as const },
];

export const revenueByType = [
  { type: 'Private Offices', amount: 168000, pct: 58 },
  { type: 'Dedicated Desks', amount: 52000, pct: 18 },
  { type: 'Hot Desks', amount: 38000, pct: 13 },
  { type: 'Meeting Rooms', amount: 18000, pct: 6 },
  { type: 'Services', amount: 11450, pct: 5 },
];

export const monthlyRevenue = [
  { month: 'Oct', recognised: 264000, deferred: 12000 },
  { month: 'Nov', recognised: 268000, deferred: 10500 },
  { month: 'Dec', recognised: 273000, deferred: 9800 },
  { month: 'Jan', recognised: 278000, deferred: 8400 },
  { month: 'Feb', recognised: 282000, deferred: 7200 },
  { month: 'Mar', recognised: 287000, deferred: 6800 },
];

export const arAgeing = [
  { band: 'Current', amount: 242000, pct: 91 },
  { band: '1-30 days', amount: 12600, pct: 5 },
  { band: '31-60 days', amount: 5400, pct: 2 },
  { band: '61-90 days', amount: 3000, pct: 1 },
  { band: '90-120 days', amount: 1800, pct: 1 },
  { band: '120+ days', amount: 1200, pct: 0 },
];

// ─── Integrations Showcase ───────────────────────────────────────────────────

export const integrationNodes = [
  { name: 'Nexudus', logo: 'https://www.koho.ai/images/logos/integrations/nexudus.svg' },
  { name: 'HubSpot', logo: 'https://www.koho.ai/images/logos/integrations/hubspot.svg' },
  { name: 'Salesforce', logo: 'https://www.koho.ai/images/logos/integrations/salesforce.svg' },
  { name: 'Xero', logo: 'https://www.koho.ai/images/logos/integrations/xero.svg' },
  { name: 'OfficeRnD', logo: 'https://www.koho.ai/images/logos/integrations/officernd.svg' },
  { name: 'Dynamics', logo: 'https://www.koho.ai/images/logos/integrations/microsoftdynamics.svg' },
];

export const integrationKPIs = [
  { label: 'Data Sources', value: '6', numericValue: 6 },
  { label: 'Records Synced', value: '47,832', numericValue: 47832 },
  { label: 'Last Sync', value: '2 min ago' },
];
