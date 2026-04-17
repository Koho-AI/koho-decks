import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import ShowcaseMockup from './ShowcaseMockup'
import { SingleSourceDashboardShowcase } from '@/app/koho/showcase/single-source-dashboard-showcase'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-single-source-dashboard'
export const layoutName = 'Koho Single Source Dashboard'
export const layoutDescription = 'Unified data dashboard showing single source of truth across all systems. Use for data strategy or platform value slides. Tone: direct, credible, warm.'

const schema = z.object({
    title: z.string().min(3).max(80).default('One view. Every system. No guesswork.').meta({
        description: "Main statement text — bold, direct, outcome-focused.",
    }),
    subtitle: z.string().min(5).max(200).default('Occupancy, revenue, and client data unified so every team works from the same numbers.').meta({
        description: "Supporting subtitle — one or two sentences below the title",
    }),
})

export const Schema = schema

type SlideData = z.infer<typeof schema>

const SingleSourceDashboardSlide: React.FC<{ data?: Partial<SlideData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)
    const title = data?.title || 'One view. Every system. No guesswork.'

    return (
        <KohoSlideChrome
            slideNumber="11"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="DATA"
            metaRight="UNIFIED · TRUSTED"
            sectionName="DATA"
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
                        {data?.subtitle || 'Occupancy, revenue, and client data unified so every team works from the same numbers.'}
                    </p>
                </div>

                {/* Dashboard mockup — bleeding off bottom-right */}
                <ShowcaseMockup theme={theme}>
                    <SingleSourceDashboardShowcase />
                </ShowcaseMockup>
            </div>
        </KohoSlideChrome>
    )
}

export default SingleSourceDashboardSlide
