import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import ShowcaseMockup from './ShowcaseMockup'
import { CommunityDashboardShowcase } from '@/app/koho/showcase/community-dashboard-showcase'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-community-dashboard'
export const layoutName = 'Koho Community Dashboard'
export const layoutDescription = 'Community and member engagement dashboard. Use for member experience or community management slides. Tone: direct, credible, warm.'

const schema = z.object({
    title: z.string().min(3).max(80).default('Member engagement at a glance').meta({
        description: "Main statement text — bold, direct, outcome-focused.",
    }),
    subtitle: z.string().min(5).max(200).default('Event attendance, member activity, and community health indicators across every location.').meta({
        description: "Supporting subtitle — one or two sentences below the title",
    }),
})

export const Schema = schema

type SlideData = z.infer<typeof schema>

const CommunityDashboardSlide: React.FC<{ data?: Partial<SlideData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)
    const title = data?.title || 'Member engagement at a glance'

    return (
        <KohoSlideChrome
            slideNumber="09"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="COMMUNITY"
            metaRight="MEMBERS · ENGAGEMENT"
            sectionName="COMMUNITY"
            contourPosition="brief"
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
                        {data?.subtitle || 'Event attendance, member activity, and community health indicators across every location.'}
                    </p>
                </div>

                {/* Dashboard mockup — bleeding off bottom-right */}
                <ShowcaseMockup theme={theme}>
                    <CommunityDashboardShowcase />
                </ShowcaseMockup>
            </div>
        </KohoSlideChrome>
    )
}

export default CommunityDashboardSlide
