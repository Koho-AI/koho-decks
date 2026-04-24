import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-bullet-list-split'
export const layoutName = 'Koho Bullet List (Split)'
export const layoutDescription = 'A split layout with a Signal Green kicker, title, and subtitle on the left, and a traditional bullet-point list on the right. Best for denser lists (5-10 items) or when you want more context next to the bullets. Tone: direct, credible, warm.'

const bulletListSplitSchema = z.object({
    kicker: z.string().min(0).max(40).default('THE PLATFORM').meta({
        description: "Short uppercase kicker label above the title",
    }),
    title: z.string().min(3).max(80).default('Built for operators, not analysts.').meta({
        description: "Slide title — direct, specific",
    }),
    subtitle: z.string().min(0).max(240).default('One place to run the portfolio. Everything connected, everything live, everything explainable to your board.').meta({
        description: "Supporting subtitle below the title",
    }),
    items: z.array(z.string().min(2).max(120)).min(4).max(10).default([
        'Unified portfolio view across every building.',
        'Live occupancy, MRR, and risk in one dashboard.',
        'Forecasting that reflects real pipeline, not wishful thinking.',
        'Retention risk surfaced 90 days before renewals.',
        'Board-ready exports in one click.',
        'Direct integrations with PMS, CRM, and billing.',
    ]).meta({
        description: "List of 4-10 bullet points. Each bullet should be a short sentence or fragment.",
    }),
})

export const Schema = bulletListSplitSchema

type BulletListSplitData = z.infer<typeof bulletListSplitSchema>

const BulletListSplitSlideLayout: React.FC<{ data?: Partial<BulletListSplitData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)

    const kicker = data?.kicker ?? 'THE PLATFORM'
    const title = data?.title ?? 'Built for operators, not analysts.'
    const subtitle = data?.subtitle ?? 'One place to run the portfolio. Everything connected, everything live, everything explainable to your board.'
    const items = data?.items ?? [
        'Unified portfolio view across every building.',
        'Live occupancy, MRR, and risk in one dashboard.',
        'Forecasting that reflects real pipeline, not wishful thinking.',
        'Retention risk surfaced 90 days before renewals.',
        'Board-ready exports in one click.',
        'Direct integrations with PMS, CRM, and billing.',
    ]

    return (
        <KohoSlideChrome
            slideNumber="05"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="THE PLATFORM"
            metaRight="CAPABILITIES · ONE VIEW"
            sectionName="THE PLATFORM"
            contourPosition="brief"
            theme={theme}
        >
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.2fr',
                gap: '72px',
                flex: 1,
                minHeight: 0,
                alignItems: 'start',
            }}>
                {/* LHS: kicker + title + subtitle */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column' as const,
                    gap: '24px',
                    paddingRight: '24px',
                    borderRight: `1px dashed ${t.ruleStrong}`,
                    height: '100%',
                }}>
                    <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '17px',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase' as const,
                        color: t.signal,
                        fontWeight: 500,
                    }}>
                        {kicker}
                    </span>

                    <h2 style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 300,
                        fontSize: '66px',
                        lineHeight: 1.02,
                        letterSpacing: '-0.025em',
                        color: t.ink,
                    }}>
                        {title}
                    </h2>

                    <p style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '28px',
                        fontWeight: 400,
                        lineHeight: 1.45,
                        color: t.ink,
                        maxWidth: '32ch',
                    }}>
                        {subtitle}
                    </p>
                </div>

                {/* RHS: bullet list */}
                <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column' as const,
                    gap: '18px',
                }}>
                    {items.map((item, i) => (
                        <li key={i} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '21px',
                            paddingBottom: '15px',
                            borderBottom: i < items.length - 1 ? `1px dashed ${t.rule2}` : 'none',
                        }}>
                            {/* Signal Green marker — chrome */}
                            <span
                                data-koho-chrome="true"
                                aria-hidden="true"
                                style={{
                                    flexShrink: 0,
                                    marginTop: '8px',
                                    color: t.signal,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: '21px',
                                    lineHeight: 1,
                                }}
                            >
                                &#9656;
                            </span>

                            {/* Item text */}
                            <p style={{
                                fontFamily: "'Manrope', sans-serif",
                                fontSize: '25px',
                                fontWeight: 400,
                                lineHeight: 1.4,
                                color: t.ink,
                                flex: 1,
                                margin: 0,
                            }}>
                                {item}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
        </KohoSlideChrome>
    )
}

export default BulletListSplitSlideLayout
