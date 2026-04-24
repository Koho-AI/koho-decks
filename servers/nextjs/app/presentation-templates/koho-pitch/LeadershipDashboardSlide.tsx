import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import ShowcaseMockup from './ShowcaseMockup'
import { LeadershipDashboardShowcase } from '@/app/koho/showcase/leadership-dashboard-showcase'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-leadership-dashboard'
export const layoutName = 'Koho Leadership Dashboard'
export const layoutDescription = 'Executive leadership dashboard with portfolio-level KPIs and strategic overview. Use for board presentations or C-suite audience. Tone: direct, credible, warm.'

const schema = z.object({
    title: z.string().min(3).max(80).default('The executive view of your portfolio').meta({
        description: "Main statement text — bold, direct, outcome-focused.",
    }),
    subtitle: z.string().min(5).max(200).default('Portfolio-level KPIs, strategic indicators, and board-ready metrics on a single screen.').meta({
        description: "Supporting subtitle — one or two sentences below the title",
    }),
})

export const Schema = schema

type SlideData = z.infer<typeof schema>

const LeadershipDashboardSlide: React.FC<{ data?: Partial<SlideData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)
    const title = data?.title || 'The executive view of your portfolio'

    return (
        <KohoSlideChrome
            slideNumber="08"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="LEADERSHIP"
            metaRight="EXECUTIVE · STRATEGIC"
            sectionName="LEADERSHIP"
            contourPosition="mark"
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
                        fontSize: '30px',
                        fontWeight: 400,
                        lineHeight: 1.45,
                        color: t.ink,
                        maxWidth: '42ch',
                    }}>
                        {data?.subtitle || 'Portfolio-level KPIs, strategic indicators, and board-ready metrics on a single screen.'}
                    </p>
                </div>

                {/* Dashboard mockup — bleeding off bottom-right */}
                <ShowcaseMockup theme={theme}>
                    <LeadershipDashboardShowcase />
                </ShowcaseMockup>
            </div>
        </KohoSlideChrome>
    )
}

export default LeadershipDashboardSlide
