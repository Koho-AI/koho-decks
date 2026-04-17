import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import ShowcaseMockup from './ShowcaseMockup'
import { FinanceDashboardShowcase } from '@/app/koho/showcase/finance-dashboard-showcase'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-finance-dashboard'
export const layoutName = 'Koho Finance Dashboard'
export const layoutDescription = 'Finance dashboard showing billing, invoicing, and revenue analytics. Use for financial overview or CFO-facing slides. Tone: direct, credible, warm.'

const schema = z.object({
    title: z.string().min(3).max(80).default('Financial clarity across every location').meta({
        description: "Main statement text — bold, direct, outcome-focused.",
    }),
    subtitle: z.string().min(5).max(200).default('Billing, invoicing, and revenue performance surfaced in real time across your entire portfolio.').meta({
        description: "Supporting subtitle — one or two sentences below the title",
    }),
})

export const Schema = schema

type SlideData = z.infer<typeof schema>

const FinanceDashboardSlide: React.FC<{ data?: Partial<SlideData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)
    const title = data?.title || 'Financial clarity across every location'

    return (
        <KohoSlideChrome
            slideNumber="02"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="FINANCE"
            metaRight="BILLING · REVENUE"
            sectionName="FINANCE"
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
                        {data?.subtitle || 'Billing, invoicing, and revenue performance surfaced in real time across your entire portfolio.'}
                    </p>
                </div>

                {/* Dashboard mockup — bleeding off bottom-right */}
                <ShowcaseMockup theme={theme}>
                    <FinanceDashboardShowcase />
                </ShowcaseMockup>
            </div>
        </KohoSlideChrome>
    )
}

export default FinanceDashboardSlide
