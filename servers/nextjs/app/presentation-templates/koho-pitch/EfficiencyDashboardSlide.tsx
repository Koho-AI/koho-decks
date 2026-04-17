import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import ShowcaseMockup from './ShowcaseMockup'
import { EfficiencyDashboardShowcase } from '@/app/koho/showcase/efficiency-dashboard-showcase'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-efficiency-dashboard'
export const layoutName = 'Koho Efficiency Dashboard'
export const layoutDescription = 'Operational efficiency dashboard with utilisation and cost metrics. Use for demonstrating ROI or efficiency gains. Tone: direct, credible, warm.'

const schema = z.object({
    title: z.string().min(3).max(80).default('Efficiency gains that compound').meta({
        description: "Main statement text — bold, direct, outcome-focused.",
    }),
    subtitle: z.string().min(5).max(200).default('Utilisation rates, cost per desk, and efficiency trends visible at the portfolio and site level.').meta({
        description: "Supporting subtitle — one or two sentences below the title",
    }),
})

export const Schema = schema

type SlideData = z.infer<typeof schema>

const EfficiencyDashboardSlide: React.FC<{ data?: Partial<SlideData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)
    const title = data?.title || 'Efficiency gains that compound'

    return (
        <KohoSlideChrome
            slideNumber="07"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="EFFICIENCY"
            metaRight="UTILISATION · ROI"
            sectionName="EFFICIENCY"
            contourPosition="thesis"
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
                        {data?.subtitle || 'Utilisation rates, cost per desk, and efficiency trends visible at the portfolio and site level.'}
                    </p>
                </div>

                {/* Dashboard mockup — bleeding off bottom-right */}
                <ShowcaseMockup theme={theme}>
                    <EfficiencyDashboardShowcase />
                </ShowcaseMockup>
            </div>
        </KohoSlideChrome>
    )
}

export default EfficiencyDashboardSlide
