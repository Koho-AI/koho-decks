import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import ShowcaseMockup from './ShowcaseMockup'
import { IntegrationsDashboardShowcase } from '@/app/koho/showcase/integrations-dashboard-showcase'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-integrations-dashboard'
export const layoutName = 'Koho Integrations Dashboard'
export const layoutDescription = 'Integrations dashboard showing connected systems and data flow. Use for technical overview or integration-focused slides. Tone: direct, credible, warm.'

const schema = z.object({
    title: z.string().min(3).max(80).default('Every system connected. One source of truth.').meta({
        description: "Main statement text — bold, direct, outcome-focused.",
    }),
    subtitle: z.string().min(5).max(200).default('PMS, CRM, billing, and access control synced and visible from a single integration layer.').meta({
        description: "Supporting subtitle — one or two sentences below the title",
    }),
})

export const Schema = schema

type SlideData = z.infer<typeof schema>

const IntegrationsDashboardSlide: React.FC<{ data?: Partial<SlideData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)
    const title = data?.title || 'Every system connected. One source of truth.'

    return (
        <KohoSlideChrome
            slideNumber="10"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="INTEGRATIONS"
            metaRight="CONNECTED · UNIFIED"
            sectionName="INTEGRATIONS"
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
                        fontSize: '23px',
                        fontWeight: 300,
                        lineHeight: 1.5,
                        color: t.inkDim,
                        maxWidth: '42ch',
                    }}>
                        {data?.subtitle || 'PMS, CRM, billing, and access control synced and visible from a single integration layer.'}
                    </p>
                </div>

                {/* Dashboard mockup — bleeding off bottom-right */}
                <ShowcaseMockup theme={theme}>
                    <IntegrationsDashboardShowcase />
                </ShowcaseMockup>
            </div>
        </KohoSlideChrome>
    )
}

export default IntegrationsDashboardSlide
