import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import ShowcaseMockup from './ShowcaseMockup'
import { RiskDashboardShowcase } from '@/app/koho/showcase/risk-dashboard-showcase'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-risk-dashboard'
export const layoutName = 'Koho Risk Dashboard'
export const layoutDescription = 'Risk intelligence dashboard with churn signals and break clause monitoring. Use for retention strategy or risk review. Tone: direct, credible, warm.'

const schema = z.object({
    title: z.string().min(3).max(80).default('Risk signals that protect revenue').meta({
        description: "Main statement text — bold, direct, outcome-focused.",
    }),
    subtitle: z.string().min(5).max(200).default('Churn indicators, break clauses, and retention risks flagged before they become surprises.').meta({
        description: "Supporting subtitle — one or two sentences below the title",
    }),
})

export const Schema = schema

type SlideData = z.infer<typeof schema>

const RiskDashboardSlide: React.FC<{ data?: Partial<SlideData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)
    const title = data?.title || 'Risk signals that protect revenue'

    return (
        <KohoSlideChrome
            slideNumber="05"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="RISK"
            metaRight="SIGNALS · PROTECTION"
            sectionName="RISK"
            contourPosition="brief"
            theme={theme}
        >
            <div style={{
                position: 'relative',
                flex: 1,
                minHeight: 0,
                overflow: 'visible',
            }}>
                {/* Title column */}
                <div style={{
                    position: 'relative',
                    zIndex: 3,
                    width: '38%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    justifyContent: 'center',
                }}>
                    <h2 style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 300,
                        fontSize: '78px',
                        lineHeight: 0.96,
                        letterSpacing: '-0.035em',
                        color: t.ink,
                        marginBottom: '30px',
                    }}>
                        {title}
                    </h2>
                    <p style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '23px',
                        fontWeight: 300,
                        lineHeight: 1.5,
                        color: t.inkDim,
                        maxWidth: '42ch',
                    }}>
                        {data?.subtitle || 'Churn indicators, break clauses, and retention risks flagged before they become surprises.'}
                    </p>
                </div>

                {/* Dashboard mockup — bleeding off bottom-right */}
                <ShowcaseMockup theme={theme}>
                    <RiskDashboardShowcase />
                </ShowcaseMockup>
            </div>
        </KohoSlideChrome>
    )
}

export default RiskDashboardSlide
