import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-table'
export const layoutName = 'Koho Table'
export const layoutDescription = 'A data table slide with title and structured rows. Use for feature comparisons, plan details, or data summaries. Keep the table concise — max 6 rows, 4 columns. Tone: direct, credible, warm.'

const tableSchema = z.object({
    title: z.string().min(3).max(80).default('Feature comparison').meta({
        description: "Slide title above the table",
    }),
    subtitle: z.string().min(0).max(200).default('').meta({
        description: "Supporting text below the title",
    }),
    headers: z.array(z.string().min(1).max(40).default('Feature').meta({
        description: "Column header text",
    })).min(2).max(4).default(['Feature', 'Starter', 'Growth', 'Enterprise']).meta({
        description: "Array of 2-4 column headers",
    }),
    rows: z.array(
        z.array(z.string().min(0).max(60).default('—').meta({
            description: "Cell value",
        })).min(2).max(4).default(['Row', '—', '—', '—']).meta({
            description: "A single table row as an array of cell values",
        })
    ).min(3).max(6).default([
        ['Portfolio dashboard', '✓', '✓', '✓'],
        ['Risk signals', '—', '✓', '✓'],
        ['API access', '—', '—', '✓'],
    ]).meta({
        description: "Array of 3-6 rows, each row is an array of cell values matching the headers",
    }),
})

export const Schema = tableSchema

type TableData = z.infer<typeof tableSchema>

const TableSlideLayout: React.FC<{ data?: Partial<TableData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)

    const title = data?.title || 'Feature comparison'
    const subtitle = data?.subtitle || ''
    const headers = data?.headers || ['Feature', 'Starter', 'Growth', 'Enterprise']
    const rows = data?.rows || [
        ['Portfolio dashboard', '✓', '✓', '✓'],
        ['Risk signals', '—', '✓', '✓'],
        ['API access', '—', '—', '✓'],
    ]

    return (
        <KohoSlideChrome
            slideNumber="06"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="DATA"
            sectionName="DATA"
            contourPosition="default"
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

            {/* Table */}
            <div style={{
                flex: 1,
                minHeight: 0,
                marginTop: '42px',
                overflow: 'hidden',
            }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse' as const,
                    tableLayout: 'fixed' as const,
                }}>
                    {/* Header row */}
                    <thead>
                        <tr>
                            {headers.map((header, i) => (
                                <th key={i} style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: '15px',
                                    letterSpacing: '0.14em',
                                    textTransform: 'uppercase' as const,
                                    color: t.signal,
                                    fontWeight: 500,
                                    textAlign: i === 0 ? 'left' as const : 'center' as const,
                                    padding: '21px 27px',
                                    background: t.bgChrome,
                                    borderBottom: `1px solid ${t.grid}`,
                                }}>
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* Body rows */}
                    <tbody>
                        {rows.map((row, rowIdx) => (
                            <tr key={rowIdx}>
                                {row.map((cell, cellIdx) => (
                                    <td key={cellIdx} style={{
                                        fontFamily: "'Manrope', sans-serif",
                                        fontSize: '21px',
                                        fontWeight: cellIdx === 0 ? 400 : 300,
                                        lineHeight: 1.55,
                                        color: t.ink,
                                        textAlign: cellIdx === 0 ? 'left' as const : 'center' as const,
                                        padding: '21px 27px',
                                        background: rowIdx % 2 === 0 ? t.bgCard : t.bg,
                                        borderBottom: `1px solid ${t.grid}`,
                                    }}>
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </KohoSlideChrome>
    )
}

export default TableSlideLayout
