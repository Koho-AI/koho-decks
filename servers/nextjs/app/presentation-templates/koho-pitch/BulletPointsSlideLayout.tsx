import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-bullet-points'
export const layoutName = 'Koho Key Points'
export const layoutDescription = 'A slide with a Signal Green title and 3-4 key point cards in a numbered grid. Each card has a heading and one-sentence description. Lead with operator outcomes, not product features. Use specific numbers where possible. Tone: direct, credible, warm.'

const bulletItemSchema = z.object({
    heading: z.string().min(2).max(40).default('Connect your data').meta({
        description: "Short heading for this key point",
    }),
    description: z.string().min(5).max(120).default('Link your PMS, CRM, and billing into one trusted view.').meta({
        description: "One-sentence supporting description",
    }),
})

const bulletPointsSchema = z.object({
    title: z.string().min(3).max(60).default('Three steps to revenue clarity.').meta({
        description: "Slide title — direct, specific",
    }),
points: z.array(bulletItemSchema).min(3).max(4).default([
        { heading: 'Connect your data', description: 'Link your PMS, CRM, and billing into one trusted view.' },
        { heading: 'Surface signals', description: 'Spot churn risk, pipeline gaps, and revenue opportunities automatically.' },
        { heading: 'Act with confidence', description: "Make decisions backed by live data, not last month's spreadsheet." },
    ]).meta({
        description: "List of 3-4 key points with heading and description",
    }),
})

export const Schema = bulletPointsSchema

type BulletData = z.infer<typeof bulletPointsSchema>

const BulletPointsSlideLayout: React.FC<{ data?: Partial<BulletData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)

    const title = data?.title || 'Three steps to revenue clarity.'
    const points = data?.points || [
        { heading: 'Connect your data', description: 'Link your PMS, CRM, and billing into one trusted view.' },
        { heading: 'Surface signals', description: 'Spot churn risk, pipeline gaps, and revenue opportunities automatically.' },
        { heading: 'Act with confidence', description: "Make decisions backed by live data, not last month's spreadsheet." },
    ]

    return (
        <KohoSlideChrome
            slideNumber="02"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="HOW IT WORKS"
            metaRight="CONNECT · SURFACE · ACT"
            sectionName="HOW IT WORKS"
            contourPosition="brief"
            theme={theme}
        >
            {/* Top section: kicker + title */}
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
            </div>

            {/* Cards grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(points.length, 4)}, 1fr)`,
                gap: '24px',
                flex: 1,
                minHeight: 0,
                marginTop: '42px',
            }}>
                {points.map((point, i) => (
                    <div key={i} style={{
                        background: t.bgCard,
                        border: `1px solid ${t.rule2}`,
                        borderLeft: `3px solid ${t.signal}`,
                        padding: '33px',
                        display: 'flex',
                        flexDirection: 'column' as const,
                        gap: '18px',
                    }}>
                        {/* Number marker */}
                        <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '14px',
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase' as const,
                            color: t.signal,
                        }}>
                            STEP {String(i + 1).padStart(2, '0')}
                        </span>

                        {/* Heading */}
                        <h5 style={{
                            fontFamily: "'Manrope', sans-serif",
                            fontWeight: 500,
                            fontSize: '27px',
                            lineHeight: 1.25,
                            color: t.ink,
                            letterSpacing: '-0.005em',
                        }}>
                            {point.heading}
                        </h5>

                        {/* Description */}
                        <p style={{
                            fontFamily: "'Manrope', sans-serif",
                            fontSize: '21px',
                            fontWeight: 300,
                            lineHeight: 1.55,
                            color: t.inkDim,
                        }}>
                            {point.description}
                        </p>
                    </div>
                ))}
            </div>
        </KohoSlideChrome>
    )
}

export default BulletPointsSlideLayout
