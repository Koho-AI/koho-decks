import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import ShowcaseMockup from './ShowcaseMockup'
import { HomeDashboardShowcase } from '@/app/koho/showcase/home-dashboard-showcase'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-home-dashboard'
export const layoutName = 'Koho Portfolio Dashboard'
export const layoutDescription = 'Full portfolio command centre showing MRR, occupancy, clients, risk, pipeline, and activity. Use for executive overview or platform introduction. Tone: direct, credible, warm.'

const schema = z.object({
    title: z.string().min(3).max(80).default('Your portfolio command centre').meta({
        description: "Main statement text — bold, direct, outcome-focused.",
    }),
    subtitle: z.string().min(5).max(200).default('MRR, occupancy, risk, and pipeline in a single live view across every location.').meta({
        description: "Supporting subtitle — one or two sentences below the title",
    }),
})

export const Schema = schema

type SlideData = z.infer<typeof schema>

const HomeDashboardSlide: React.FC<{ data?: Partial<SlideData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)
    const title = data?.title || 'Your portfolio command centre'

    return (
        <KohoSlideChrome
            slideNumber="01"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="PORTFOLIO"
            metaRight="COMMAND CENTRE · LIVE VIEW"
            sectionName="PORTFOLIO"
            contourPosition="cover"
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
                        {data?.subtitle || 'MRR, occupancy, risk, and pipeline in a single live view across every location.'}
                    </p>
                </div>

                {/* Dashboard mockup — bleeding off bottom-right */}
                <ShowcaseMockup theme={theme}>
                    <HomeDashboardShowcase />
                </ShowcaseMockup>
            </div>
        </KohoSlideChrome>
    )
}

export default HomeDashboardSlide
