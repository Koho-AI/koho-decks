import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-timeline'
export const layoutName = 'Koho Timeline'
export const layoutDescription = 'A horizontal timeline showing 3-5 sequential phases or steps. Use for roadmaps, implementation plans, or process flows. Each step has a label and description. Tone: direct, credible, warm.'

const timelineStepSchema = z.object({
    label: z.string().min(2).max(30).default('Week 1-2').meta({
        description: "Short label for this timeline step",
    }),
    description: z.string().min(5).max(120).default('Connect your data sources').meta({
        description: "Brief description of what happens in this step",
    }),
})

const timelineSchema = z.object({
    title: z.string().min(3).max(80).default('Six weeks to live revenue').meta({
        description: "Slide title — describes the timeline purpose",
    }),
    subtitle: z.string().min(0).max(200).default('').meta({
        description: "Supporting text below the title",
    }),
    steps: z.array(timelineStepSchema).min(3).max(5).default([
        { label: 'Week 1-2', description: 'Connect your data sources' },
        { label: 'Week 3-4', description: 'Configure dashboards and signals' },
        { label: 'Week 5-6', description: 'Go live with full portfolio view' },
    ]).meta({
        description: "List of 3-5 timeline steps with label and description",
    }),
})

export const Schema = timelineSchema

type TimelineData = z.infer<typeof timelineSchema>

const TimelineSlideLayout: React.FC<{ data?: Partial<TimelineData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)

    const title = data?.title || 'Six weeks to live revenue'
    const subtitle = data?.subtitle || ''
    const steps = data?.steps || [
        { label: 'Week 1-2', description: 'Connect your data sources' },
        { label: 'Week 3-4', description: 'Configure dashboards and signals' },
        { label: 'Week 5-6', description: 'Go live with full portfolio view' },
    ]

    return (
        <KohoSlideChrome
            slideNumber="04"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="TIMELINE"
            sectionName="TIMELINE"
            contourPosition="default"
            theme={theme}
        >
            {/* Title section */}
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
                }}>
                    {title}
                </h2>
                {subtitle && (
                    <p style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '23px',
                        fontWeight: 300,
                        lineHeight: 1.5,
                        color: t.inkDim,
                        maxWidth: '54ch',
                        marginTop: '12px',
                    }}>
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Timeline */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'center',
                marginTop: '42px',
            }}>
                {/* Timeline bar with dots */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative' as const,
                    marginBottom: '36px',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                }}>
                    {/* Connecting line */}
                    <div style={{
                        position: 'absolute' as const,
                        top: '50%',
                        left: '24px',
                        right: '24px',
                        height: '3px',
                        background: t.signal,
                        opacity: 0.3,
                        transform: 'translateY(-50%)',
                    }} />

                    {/* Dots */}
                    {steps.map((_, i) => (
                        <div key={i} style={{
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'center',
                            position: 'relative' as const,
                            zIndex: 1,
                        }}>
                            <div style={{
                                width: '21px',
                                height: '21px',
                                borderRadius: '50%',
                                background: t.signal,
                                border: `5px solid ${t.bg}`,
                                boxShadow: `0 0 0 3px ${t.signal}`,
                            }} />
                        </div>
                    ))}
                </div>

                {/* Step cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
                    gap: '24px',
                }}>
                    {steps.map((step, i) => (
                        <div key={i} style={{
                            background: t.bgCard,
                            border: `1px solid ${t.rule2}`,
                            padding: '30px',
                            display: 'flex',
                            flexDirection: 'column' as const,
                            gap: '15px',
                        }}>
                            <span style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '15px',
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase' as const,
                                color: t.signal,
                            }}>
                                {step.label}
                            </span>
                            <p style={{
                                fontFamily: "'Manrope', sans-serif",
                                fontSize: '21px',
                                fontWeight: 300,
                                lineHeight: 1.55,
                                color: t.inkDim,
                            }}>
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </KohoSlideChrome>
    )
}

export default TimelineSlideLayout
