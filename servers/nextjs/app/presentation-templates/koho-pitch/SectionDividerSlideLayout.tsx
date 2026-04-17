import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-section-divider'
export const layoutName = 'Koho Section Divider'
export const layoutDescription = 'A minimal section divider slide with chapter number and title. Use to mark transitions between deck sections. Keep the title to 2-4 words. Tone: direct, credible, warm.'

const sectionDividerSchema = z.object({
    sectionNumber: z.string().min(1).max(10).default('02').meta({
        description: "Section or chapter number, e.g. 01, 02, 03",
    }),
    sectionTitle: z.string().min(2).max(40).default('The Platform').meta({
        description: "Short section title — 2-4 words",
    }),
    subtitle: z.string().min(0).max(200).default('').meta({
        description: "Supporting text below the section title",
    }),
})

export const Schema = sectionDividerSchema

type SectionDividerData = z.infer<typeof sectionDividerSchema>

const SectionDividerSlideLayout: React.FC<{ data?: Partial<SectionDividerData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)

    const sectionNumber = data?.sectionNumber || '02'
    const sectionTitle = data?.sectionTitle || 'The Platform'
    const subtitle = data?.subtitle || ''

    return (
        <KohoSlideChrome
            slideNumber="01"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="SECTION"
            sectionName="SECTION"
            contourPosition="thesis"
            theme={theme}
        >
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                {/* Green line */}
                <div style={{
                    width: '90px',
                    height: '1px',
                    background: t.signal,
                    marginBottom: '30px',
                }} />

                {/* Section number */}
                <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '21px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase' as const,
                    color: t.signal,
                    marginBottom: '30px',
                }}>
                    {sectionNumber}
                </span>

                {/* Section title */}
                <h1 style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 300,
                    fontSize: '96px',
                    lineHeight: 1.0,
                    letterSpacing: '-0.035em',
                    color: t.ink,
                    textAlign: 'center' as const,
                }}>
                    {sectionTitle}
                </h1>

                {/* Subtitle */}
                {subtitle && (
                    <p style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '23px',
                        fontWeight: 300,
                        lineHeight: 1.5,
                        color: t.inkDim,
                        maxWidth: '54ch',
                        marginTop: '12px',
                        textAlign: 'center' as const,
                    }}>
                        {subtitle}
                    </p>
                )}
            </div>
        </KohoSlideChrome>
    )
}

export default SectionDividerSlideLayout
