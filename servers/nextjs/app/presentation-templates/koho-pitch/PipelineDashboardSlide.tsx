import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import ShowcaseMockup from './ShowcaseMockup'
import { PipelineDashboardShowcase } from '@/app/koho/showcase/pipeline-dashboard-showcase'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-pipeline-dashboard'
export const layoutName = 'Koho Pipeline Dashboard'
export const layoutDescription = 'Pipeline management dashboard with deal tracking and conversion analytics. Use for sales leadership or pipeline review. Tone: direct, credible, warm.'

const schema = z.object({
    title: z.string().min(3).max(80).default('Pipeline that matches reality').meta({
        description: "Main statement text — bold, direct, outcome-focused.",
    }),
    subtitle: z.string().min(5).max(200).default('Every deal, stage, and conversion metric visible so nothing slips between handoffs.').meta({
        description: "Supporting subtitle — one or two sentences below the title",
    }),
})

export const Schema = schema

type SlideData = z.infer<typeof schema>

const PipelineDashboardSlide: React.FC<{ data?: Partial<SlideData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)
    const title = data?.title || 'Pipeline that matches reality'

    return (
        <KohoSlideChrome
            slideNumber="03"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="PIPELINE"
            metaRight="DEALS · CONVERSION"
            sectionName="PIPELINE"
            contourPosition="default"
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
                        {data?.subtitle || 'Every deal, stage, and conversion metric visible so nothing slips between handoffs.'}
                    </p>
                </div>

                {/* Dashboard mockup — bleeding off bottom-right */}
                <ShowcaseMockup theme={theme}>
                    <PipelineDashboardShowcase />
                </ShowcaseMockup>
            </div>
        </KohoSlideChrome>
    )
}

export default PipelineDashboardSlide
