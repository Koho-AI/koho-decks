import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import ShowcaseMockup from './ShowcaseMockup'
import { SalesDashboardShowcase } from '@/app/koho/showcase/sales-dashboard-showcase'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-dashboard-showcase'
export const layoutName = 'Koho Dashboard'
export const layoutDescription = 'A hero product slide with large Signal Green statement text on the left and the full Koho dashboard mockup bleeding off the bottom-right. Use for platform introduction or product overview. Title should be a bold outcome statement. Subtitle explains what the operator sees, not what Koho does. Tone: direct, credible, warm.'

const schema = z.object({
    title: z.string().min(3).max(80).default('Your portfolio. One live view.').meta({
        description: "Main statement text — bold, direct, outcome-focused.",
    }),
subtitle: z.string().min(5).max(200).default('Koho connects your PMS, CRM, and billing so you see what\'s at risk, what\'s working, and what to do next.').meta({
        description: "Supporting subtitle — one or two sentences below the title",
    }),
})

export const Schema = schema

type SlideData = z.infer<typeof schema>

const DashboardShowcaseSlide: React.FC<{ data?: Partial<SlideData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)

    const title = data?.title || 'Your portfolio. One live view.'

    return (
        <KohoSlideChrome
            slideNumber="01"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="THE PLATFORM"
            metaRight="PORTFOLIO · COMMAND CENTRE"
            sectionName="PLATFORM"
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
                        fontSize: '30px',
                        fontWeight: 400,
                        lineHeight: 1.45,
                        color: t.ink,
                        maxWidth: '42ch',
                    }}>
                        {data?.subtitle || 'Koho connects your PMS, CRM, and billing so you see what\'s at risk, what\'s working, and what to do next.'}
                    </p>
                </div>

                {/* Dashboard mockup — bleeding off bottom-right */}
                <ShowcaseMockup theme={theme}>
                    <SalesDashboardShowcase />
                </ShowcaseMockup>
            </div>
        </KohoSlideChrome>
    )
}

export default DashboardShowcaseSlide
