import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import ShowcaseMockup from './ShowcaseMockup'
import { ForecastDashboardShowcase } from '@/app/koho/showcase/forecast-dashboard-showcase'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-forecast-dashboard'
export const layoutName = 'Koho Forecast Dashboard'
export const layoutDescription = 'Revenue forecasting dashboard with predictive analytics. Use for planning, budgeting, or investor slides. Tone: direct, credible, warm.'

const schema = z.object({
    title: z.string().min(3).max(80).default('Revenue forecasting you can trust').meta({
        description: "Main statement text — bold, direct, outcome-focused.",
    }),
    subtitle: z.string().min(5).max(200).default('Forward-looking revenue projections built from live occupancy, lease terms, and pipeline data.').meta({
        description: "Supporting subtitle — one or two sentences below the title",
    }),
})

export const Schema = schema

type SlideData = z.infer<typeof schema>

const ForecastDashboardSlide: React.FC<{ data?: Partial<SlideData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)
    const title = data?.title || 'Revenue forecasting you can trust'

    return (
        <KohoSlideChrome
            slideNumber="04"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="FORECASTING"
            metaRight="PREDICTIVE · PLANNING"
            sectionName="FORECASTING"
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
                        {data?.subtitle || 'Forward-looking revenue projections built from live occupancy, lease terms, and pipeline data.'}
                    </p>
                </div>

                {/* Dashboard mockup — bleeding off bottom-right */}
                <ShowcaseMockup theme={theme}>
                    <ForecastDashboardShowcase />
                </ShowcaseMockup>
            </div>
        </KohoSlideChrome>
    )
}

export default ForecastDashboardSlide
