import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-metrics'
export const layoutName = 'Koho Metrics'
export const layoutDescription = 'A slide displaying 2-3 large stat cards with giant Signal Green metric values, labels, and descriptions. Use real or realistic numbers with units. Describe what each metric means for the operator, not how Koho calculates it. Tone: direct, credible, warm.'

const metricItemSchema = z.object({
    value: z.string().min(1).max(12).default('94').meta({
        description: "The metric value — a number without unit (unit goes in the unit field)",
    }),
    unit: z.string().min(0).max(5).default('%').meta({
        description: "Unit suffix like %, £, k, M — displayed smaller next to the value",
    }),
    label: z.string().min(2).max(40).default('Portfolio occupancy').meta({
        description: "What this metric measures — short heading",
    }),
    description: z.string().min(5).max(120).default('Across all managed locations, updated in real time.').meta({
        description: "One sentence explaining the metric",
    }),
})

const metricsSchema = z.object({
    title: z.string().min(3).max(60).default('The numbers that matter.').meta({
        description: "Slide title — direct, outcome-focused",
    }),
subtitle: z.string().min(0).max(150).default('Live portfolio metrics. No spreadsheet required.').meta({
        description: "Optional subtitle providing context",
    }),
    metrics: z.array(metricItemSchema).min(2).max(3).default([
        { value: '94', unit: '%', label: 'Portfolio occupancy', description: 'Across all managed locations, updated in real time.' },
        { value: '£2.4', unit: 'M', label: 'Monthly recurring revenue', description: 'Connected from PMS, CRM, and billing in one view.' },
        { value: '12', unit: '', label: 'Renewals at risk', description: 'Surfaced 90 days out. Each with a recommended action.' },
    ]).meta({
        description: "2-3 key metrics to display as large stat cards",
    }),
})

export const Schema = metricsSchema

type MetricsData = z.infer<typeof metricsSchema>

const MetricsSlideLayout: React.FC<{ data?: Partial<MetricsData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)

    const title = data?.title || 'The numbers that matter.'
    const metrics = data?.metrics || [
        { value: '94', unit: '%', label: 'Portfolio occupancy', description: 'Across all managed locations, updated in real time.' },
        { value: '£2.4', unit: 'M', label: 'Monthly recurring revenue', description: 'Connected from PMS, CRM, and billing in one view.' },
        { value: '12', unit: '', label: 'Renewals at risk', description: 'Surfaced 90 days out. Each with a recommended action.' },
    ]

    return (
        <KohoSlideChrome
            slideNumber="03"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="PERFORMANCE"
            metaRight="LIVE METRICS · PORTFOLIO VIEW"
            sectionName="PERFORMANCE"
            contourPosition="mark"
            theme={theme}
        >
            {/* Top section */}
            <div style={{
                display: 'flex',
                flexDirection: 'column' as const,
                gap: '21px',
                paddingBottom: '27px',
                borderBottom: `1px dashed ${t.ruleStrong}`,
            }}>
                <h2 style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 300,
                    fontSize: '72px',
                    lineHeight: 1.02,
                    letterSpacing: '-0.025em',
                    color: t.ink,
                    maxWidth: '22ch',
                }}>
                    {title}
                </h2>
                {data?.subtitle && (
                    <p style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '23px',
                        fontWeight: 300,
                        lineHeight: 1.5,
                        color: t.inkDim,
                        maxWidth: '60ch',
                    }}>
                        {data.subtitle}
                    </p>
                )}
            </div>

            {/* Stat cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${metrics.length}, 1fr)`,
                gap: '30px',
                flex: 1,
                minHeight: 0,
                marginTop: '48px',
            }}>
                {metrics.map((metric, i) => (
                    <div key={i} style={{
                        background: t.bgCard,
                        border: `1px solid ${t.rule2}`,
                        padding: '42px',
                        display: 'flex',
                        flexDirection: 'column' as const,
                        gap: '21px',
                        justifyContent: 'space-between',
                        position: 'relative' as const,
                        overflow: 'hidden',
                    }}>
                        {/* Radial glow */}
                        <div style={{
                            position: 'absolute' as const,
                            inset: 0,
                            pointerEvents: 'none' as const,
                            background: `radial-gradient(circle at 100% 0%, ${t.signalTint} 0%, transparent 50%)`,
                        }} />

                        {/* Giant figure */}
                        <span style={{
                            fontFamily: "'Manrope', sans-serif",
                            fontWeight: 300,
                            fontSize: '144px',
                            lineHeight: 0.85,
                            color: t.signal,
                            letterSpacing: '-0.04em',
                            textShadow: `0 0 60px ${t.signalGlow}`,
                            fontVariantNumeric: 'tabular-nums',
                            position: 'relative' as const,
                        }}>
                            {metric.value}
                            {metric.unit && (
                                <span style={{ fontSize: '0.5em', color: t.signal, opacity: 0.75, marginLeft: '0.05em', fontWeight: 400 }}>
                                    {metric.unit}
                                </span>
                            )}
                        </span>

                        {/* Label + description */}
                        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '9px', position: 'relative' as const }}>
                            <h5 style={{
                                fontFamily: "'Manrope', sans-serif",
                                fontWeight: 500,
                                fontSize: '27px',
                                color: t.ink,
                                letterSpacing: '-0.005em',
                            }}>
                                {metric.label}
                            </h5>
                            <p style={{
                                fontFamily: "'Manrope', sans-serif",
                                fontSize: '20px',
                                fontWeight: 300,
                                lineHeight: 1.5,
                                color: t.inkDim,
                            }}>
                                {metric.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </KohoSlideChrome>
    )
}

export default MetricsSlideLayout
