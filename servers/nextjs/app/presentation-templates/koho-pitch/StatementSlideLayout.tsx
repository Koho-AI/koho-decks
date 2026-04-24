import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-statement'
export const layoutName = 'Koho Statement'
export const layoutDescription = 'A bold statement slide with one or two lines of massive centred text. Use for section dividers, thesis moments, or key claims. Keep it to under 15 words. Tone: direct, credible, warm.'

const statementSchema = z.object({
    subtitle: z.string().min(0).max(200).default('A single truth your audience should remember').meta({
        description: "Supporting text below the title marker",
    }),
    statement: z.string().min(3).max(80).default('Your data lives in six systems. None of them agree.').meta({
        description: "The bold statement text — one or two lines, under 15 words",
    }),
    footnote: z.string().min(0).max(120).default('Not a rebrand. An evolution — sharper, more purposeful, still Koho.').meta({
        description: "Optional footnote or clarifying line below the statement",
    }),
})

export const Schema = statementSchema

type StatementData = z.infer<typeof statementSchema>

const StatementSlideLayout: React.FC<{ data?: Partial<StatementData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)

    const subtitle = data?.subtitle || ''
    const statement = data?.statement || 'Your data lives in six systems. None of them agree.'
    const footnote = data?.footnote || 'Not a rebrand. An evolution — sharper, more purposeful, still Koho.'

    return (
        <KohoSlideChrome
            slideNumber="02"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="STATEMENT"
            sectionName="STATEMENT"
            contourPosition="thesis"
            theme={theme}
        >
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'flex-start',
                justifyContent: 'center',
            }}>
                {/* Green marker */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column' as const,
                    alignItems: 'flex-start',
                    gap: '15px',
                    marginBottom: '48px',
                }}>
                    <div style={{
                        width: '90px',
                        height: '1px',
                        background: t.signalEdge,
                    }} />
                    <span
                        data-koho-chrome="true"
                        style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '17px',
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase' as const,
                            color: t.signal,
                        }}>
                        &#9650; STATEMENT
                    </span>
                </div>

                {/* Subtitle */}
                {subtitle && (
                    <p style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '30px',
                        fontWeight: 400,
                        lineHeight: 1.45,
                        color: t.ink,
                        maxWidth: '54ch',
                        marginTop: '12px',
                        marginBottom: '36px',
                        textAlign: 'left' as const,
                    }}>
                        {subtitle}
                    </p>
                )}

                {/* Statement text */}
                <h1 style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 300,
                    fontSize: '108px',
                    lineHeight: 0.96,
                    letterSpacing: '-0.035em',
                    color: t.ink,
                    textAlign: 'left' as const,
                    maxWidth: '20ch',
                }}>
                    {statement}
                </h1>

                {/* Footnote */}
                {footnote && (
                    <p style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '21px',
                        fontWeight: 300,
                        lineHeight: 1.55,
                        color: t.inkDim,
                        textAlign: 'left' as const,
                        marginTop: '48px',
                        maxWidth: '48ch',
                    }}>
                        {footnote}
                    </p>
                )}
            </div>
        </KohoSlideChrome>
    )
}

export default StatementSlideLayout
