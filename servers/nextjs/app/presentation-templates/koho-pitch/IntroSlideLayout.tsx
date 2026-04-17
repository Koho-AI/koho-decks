import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-intro-slide'
export const layoutName = 'Koho Cover Slide'
export const layoutDescription = 'A branded cover slide with large Signal Green statement title, subtitle, and presenter metadata. Uses the Koho grid chrome with contour wash. Write the title as a bold outcome statement (3-6 words). Subtitle should name the problem before the solution. Tone: direct, credible, warm — no corporate filler.'

const introSchema = z.object({
    title: z.string().min(3).max(80).default('Workspace Revenue. Delivered.').meta({
        description: "Main presentation title — bold, specific, outcome-led. Keep it short: 3-6 words.",
    }),
subtitle: z.string().min(5).max(200).default("Why we're sharpening Koho's identity, what's changing, and what stays exactly the same.").meta({
        description: "Supporting subtitle — one or two sentences. Can use bold for key phrases by wrapping in **double asterisks**.",
    }),
    presenterName: z.string().min(2).max(50).default('Koho').meta({
        description: "Name of the presenter, team, or company",
    }),
    presenterRole: z.string().min(2).max(60).default('The RevOps platform\nfor flexible workspace operators').meta({
        description: "Role, tagline, or description below the presenter name",
    }),
    presentationDate: z.string().min(2).max(30).default('April 2026').meta({
        description: "Date or version of the presentation",
    }),
    metaLabel: z.string().min(0).max(40).default('Working draft').meta({
        description: "Optional metadata label, e.g. version or document type",
    }),
})

export const Schema = introSchema

type IntroData = z.infer<typeof introSchema>

const IntroSlideLayout: React.FC<{ data?: Partial<IntroData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)

    const title = data?.title || 'Workspace Revenue. Delivered.'

    return (
        <KohoSlideChrome
            slideNumber="01"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="COVER"
            sectionName="COVER"
            contourPosition="cover"
            hideHeaderMark={true}
            theme={theme}
        >
            {/* Wordmark */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.logoSrc} alt="Koho" width={300} style={{ height: 'auto' }} />

                <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '17px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    color: t.inkDim,
                    textAlign: 'right' as const,
                    lineHeight: 1.7,
                }}>
                    <div>FOR</div>
                    <div style={{ color: t.signal, fontWeight: 500 }}>THE KOHO TEAM</div>
                </div>
            </div>

            {/* Title */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
                <h1 style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 300,
                    fontSize: '126px',
                    lineHeight: 0.92,
                    letterSpacing: '-0.04em',
                    color: t.ink,
                }}>
                    {title}
                </h1>
                <p style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 300,
                    fontSize: '33px',
                    lineHeight: 1.4,
                    color: t.inkDim,
                    maxWidth: '42ch',
                    marginTop: '27px',
                }}>
                    {data?.subtitle || "Why we're sharpening Koho's identity, what's changing, and what stays exactly the same."}
                </p>
            </div>

            {/* Bottom meta */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '17px',
                letterSpacing: '0.04em',
                color: t.inkDim,
                lineHeight: 1.7,
            }}>
                <div>
                    <div style={{ color: t.ink, fontWeight: 500, fontFamily: "'Manrope', sans-serif", fontSize: '20px', letterSpacing: '-0.005em', marginBottom: '3px' }}>
                        {data?.presenterName || 'Koho'}
                    </div>
                    <div style={{ whiteSpace: 'pre-line' }}>
                        {data?.presenterRole || 'The RevOps platform\nfor flexible workspace operators'}
                    </div>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                    <div style={{ color: t.ink, fontWeight: 500, fontFamily: "'Manrope', sans-serif", fontSize: '20px' }}>
                        {data?.metaLabel || 'Working draft'}
                    </div>
                    <div>{data?.presentationDate || 'April 2026'}</div>
                </div>
            </div>
        </KohoSlideChrome>
    )
}

export default IntroSlideLayout
