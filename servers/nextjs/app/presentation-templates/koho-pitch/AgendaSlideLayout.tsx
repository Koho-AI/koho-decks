import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-agenda'
export const layoutName = 'Koho Agenda'
export const layoutDescription = 'A numbered agenda or table of contents slide listing deck sections. Use at the start of a presentation to set expectations. Keep to 4-8 items. Tone: direct, credible, warm.'

const agendaItemSchema = z.object({
    label: z.string().min(2).max(60).default('The challenge').meta({
        description: "Agenda item label",
    }),
    pageNumber: z.string().min(0).max(10).default('03').meta({
        description: "Optional page number reference for this item",
    }),
})

const agendaSchema = z.object({
    title: z.string().min(2).max(60).default('Agenda').meta({
        description: "Slide title — typically 'Agenda' or 'Contents'",
    }),
    subtitle: z.string().min(0).max(200).default('').meta({
        description: "Supporting text below the title",
    }),
    items: z.array(agendaItemSchema).min(2).max(8).default([
        { label: 'The challenge', pageNumber: '03' },
        { label: 'The platform', pageNumber: '04' },
        { label: 'Key metrics', pageNumber: '05' },
        { label: 'Pricing', pageNumber: '06' },
        { label: 'Next steps', pageNumber: '07' },
    ]).meta({
        description: "List of 4-8 agenda items with label and optional page number",
    }),
})

export const Schema = agendaSchema

type AgendaData = z.infer<typeof agendaSchema>

const AgendaSlideLayout: React.FC<{ data?: Partial<AgendaData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)

    const title = data?.title || 'Agenda'
    const subtitle = data?.subtitle || ''
    const items = (data?.items || [
        { label: 'The challenge', pageNumber: '03' },
        { label: 'The platform', pageNumber: '04' },
        { label: 'Key metrics', pageNumber: '05' },
        { label: 'Pricing', pageNumber: '06' },
        { label: 'Next steps', pageNumber: '07' },
    ]).filter(item => item.label && item.label.trim().length > 0)

    return (
        <KohoSlideChrome
            slideNumber="02"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="CONTENTS"
            sectionName="CONTENTS"
            contourPosition="brief"
            theme={theme}
        >
            {/* Title section */}
            <div style={{
                display: 'flex',
                flexDirection: 'column' as const,
                gap: '21px',
                paddingBottom: '27px',
                borderBottom: `1px dashed ${t.ruleStrong}`,
            }}>
                <h2 style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 300,
                    fontSize: '72px',
                    lineHeight: 1.02,
                    letterSpacing: '-0.025em',
                    color: t.ink,
                }}>
                    {title}
                </h2>
                {subtitle && (
                    <p style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '30px',
                        fontWeight: 400,
                        lineHeight: 1.45,
                        color: t.ink,
                        maxWidth: '54ch',
                        marginTop: '12px',
                    }}>
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Agenda items */}
            <div style={{
                flex: 1,
                minHeight: 0,
                marginTop: '42px',
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'center',
                gap: '0',
            }}>
                {items.map((item, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '30px',
                        padding: '21px 0',
                        borderBottom: i < items.length - 1 ? `1px dashed ${t.rule2}` : 'none',
                    }}>
                        {/* Number marker */}
                        <div style={{
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${t.signalEdge}`,
                            background: t.signalTint,
                            flexShrink: 0,
                        }}>
                            <span
                                data-koho-chrome="true"
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: '20px',
                                    fontWeight: 500,
                                    color: t.signal,
                                }}>
                                {String(i + 1).padStart(2, '0')}
                            </span>
                        </div>

                        {/* Label */}
                        <span style={{
                            fontFamily: "'Manrope', sans-serif",
                            fontSize: '30px',
                            fontWeight: 400,
                            color: t.ink,
                            flex: 1,
                        }}>
                            {item.label}
                        </span>

                        {/* Page number */}
                        {item.pageNumber && (
                            <span style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '17px',
                                letterSpacing: '0.04em',
                                color: t.inkFaint,
                                fontVariantNumeric: 'tabular-nums',
                            }}>
                                {item.pageNumber}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </KohoSlideChrome>
    )
}

export default AgendaSlideLayout
