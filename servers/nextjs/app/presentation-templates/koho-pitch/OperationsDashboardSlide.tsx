import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import ShowcaseMockup from './ShowcaseMockup'
import { OperationsDashboardShowcase } from '@/app/koho/showcase/operations-dashboard-showcase'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-operations-dashboard'
export const layoutName = 'Koho Operations Dashboard'
export const layoutDescription = 'Operations dashboard showing facility management and operational metrics. Use for ops review or building manager audience. Tone: direct, credible, warm.'

const schema = z.object({
    title: z.string().min(3).max(80).default('Operations visibility across every building').meta({
        description: "Main statement text — bold, direct, outcome-focused.",
    }),
    subtitle: z.string().min(5).max(200).default('Facility status, maintenance tickets, and operational metrics tracked per location in one view.').meta({
        description: "Supporting subtitle — one or two sentences below the title",
    }),
})

export const Schema = schema

type SlideData = z.infer<typeof schema>

const OperationsDashboardSlide: React.FC<{ data?: Partial<SlideData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)
    const title = data?.title || 'Operations visibility across every building'

    return (
        <KohoSlideChrome
            slideNumber="06"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="OPERATIONS"
            metaRight="FACILITIES · EFFICIENCY"
            sectionName="OPERATIONS"
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
                        {data?.subtitle || 'Facility status, maintenance tickets, and operational metrics tracked per location in one view.'}
                    </p>
                </div>

                {/* Dashboard mockup — bleeding off bottom-right */}
                <ShowcaseMockup theme={theme}>
                    <OperationsDashboardShowcase />
                </ShowcaseMockup>
            </div>
        </KohoSlideChrome>
    )
}

export default OperationsDashboardSlide
