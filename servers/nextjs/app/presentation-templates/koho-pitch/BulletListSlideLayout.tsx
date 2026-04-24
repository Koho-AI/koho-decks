import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-bullet-list'
export const layoutName = 'Koho Bullet List'
export const layoutDescription = 'A traditional vertical bullet-point list with a title, optional subtitle, and 4-8 concise items. Each item has a Signal Green marker and roomy spacing. Use for feature lists, benefits, takeaways, or dense enumerations. Tone: direct, credible, warm.'

const bulletListSchema = z.object({
    title: z.string().min(3).max(80).default('What you get with Koho.').meta({
        description: "Slide title — direct, specific",
    }),
    subtitle: z.string().min(0).max(200).default('Everything operators need to run a portfolio without the spreadsheet-shuffle.').meta({
        description: "Optional supporting subtitle below the title",
    }),
    items: z.array(z.string().min(2).max(140)).min(3).max(8).default([
        'One unified view of every system — PMS, CRM, billing, and access control.',
        'Live occupancy, revenue, and risk signals refreshed in real time.',
        'Forecasts and retention risk flagged 90 days before renewal.',
        'Executive dashboards and board-ready exports ready on demand.',
        'Built for workspace operators. No spreadsheet required.',
    ]).meta({
        description: "List of 3-8 bullet points. Each bullet is one concise sentence or fragment.",
    }),
})

export const Schema = bulletListSchema

type BulletListData = z.infer<typeof bulletListSchema>

const BulletListSlideLayout: React.FC<{ data?: Partial<BulletListData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)

    const title = data?.title ?? 'What you get with Koho.'
    const subtitle = data?.subtitle ?? 'Everything operators need to run a portfolio without the spreadsheet-shuffle.'
    const items = data?.items ?? [
        'One unified view of every system — PMS, CRM, billing, and access control.',
        'Live occupancy, revenue, and risk signals refreshed in real time.',
        'Forecasts and retention risk flagged 90 days before renewal.',
        'Executive dashboards and board-ready exports ready on demand.',
        'Built for workspace operators. No spreadsheet required.',
    ]

    return (
        <KohoSlideChrome
            slideNumber="04"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="WHAT YOU GET"
            metaRight="FEATURES · CAPABILITIES"
            sectionName="WHAT YOU GET"
            contourPosition="brief"
            theme={theme}
        >
            {/* Top section: title + subtitle */}
            <div style={{
                display: 'flex',
                flexDirection: 'column' as const,
                gap: '18px',
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
                <p style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '30px',
                    fontWeight: 400,
                    lineHeight: 1.45,
                    color: t.ink,
                    maxWidth: '64ch',
                }}>
                    {subtitle}
                </p>
            </div>

            {/* Bullet list */}
            <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                marginTop: '42px',
                display: 'flex',
                flexDirection: 'column' as const,
                gap: '21px',
                flex: 1,
                minHeight: 0,
            }}>
                {items.map((item, i) => (
                    <li key={i} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '24px',
                        paddingBottom: '18px',
                        borderBottom: i < items.length - 1 ? `1px dashed ${t.rule2}` : 'none',
                    }}>
                        {/* Signal Green marker — chrome */}
                        <span
                            data-koho-chrome="true"
                            aria-hidden="true"
                            style={{
                                flexShrink: 0,
                                marginTop: '10px',
                                color: t.signal,
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '24px',
                                lineHeight: 1,
                                letterSpacing: '0',
                            }}
                        >
                            &#9656;
                        </span>

                        {/* Item text */}
                        <p style={{
                            fontFamily: "'Manrope', sans-serif",
                            fontSize: '28px',
                            fontWeight: 400,
                            lineHeight: 1.45,
                            color: t.ink,
                            flex: 1,
                            margin: 0,
                        }}>
                            {item}
                        </p>
                    </li>
                ))}
            </ul>
        </KohoSlideChrome>
    )
}

export default BulletListSlideLayout
