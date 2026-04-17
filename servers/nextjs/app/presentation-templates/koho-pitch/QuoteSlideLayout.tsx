import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-quote'
export const layoutName = 'Koho Quote'
export const layoutDescription = 'A testimonial or quote slide with large italic text and attribution. Use for customer proof, endorsements, or team quotes. Tone: direct, credible, warm.'

const quoteSchema = z.object({
    subtitle: z.string().min(0).max(200).default('').meta({
        description: "Supporting context text displayed above the quote",
    }),
    quote: z.string().min(10).max(300).default("Koho gave us visibility we didn't know we were missing. We spotted £40k in break clause risk in the first week.").meta({
        description: "The quote text — a compelling testimonial or endorsement",
    }),
    author: z.string().min(2).max(60).default('Sarah Chen').meta({
        description: "Name of the person being quoted",
    }),
    role: z.string().min(2).max(80).default('Operations Director, Huckletree').meta({
        description: "Role and company of the person being quoted",
    }),
    company: z.string().min(0).max(60).default('').meta({
        description: "Optional company name if not included in role",
    }),
})

export const Schema = quoteSchema

type QuoteData = z.infer<typeof quoteSchema>

const QuoteSlideLayout: React.FC<{ data?: Partial<QuoteData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)

    const subtitle = data?.subtitle || ''
    const quote = data?.quote || "Koho gave us visibility we didn't know we were missing. We spotted £40k in break clause risk in the first week."
    const author = data?.author || 'Sarah Chen'
    const role = data?.role || 'Operations Director, Huckletree'
    const company = data?.company || ''

    return (
        <KohoSlideChrome
            slideNumber="05"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="TESTIMONIAL"
            sectionName="TESTIMONIAL"
            contourPosition="mark"
            theme={theme}
        >
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'center',
                paddingLeft: '24px',
            }}>
                {/* Subtitle / context */}
                {subtitle && (
                    <p style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '23px',
                        fontWeight: 300,
                        lineHeight: 1.5,
                        color: t.inkDim,
                        maxWidth: '54ch',
                        marginTop: '12px',
                        marginBottom: '24px',
                    }}>
                        {subtitle}
                    </p>
                )}

                {/* Decorative quotation mark */}
                <span style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '72px',
                    fontWeight: 300,
                    lineHeight: 1,
                    color: t.signal,
                    marginBottom: '24px',
                    display: 'block',
                }}>
                    &ldquo;
                </span>

                {/* Quote text */}
                <blockquote style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 300,
                    fontSize: '54px',
                    fontStyle: 'italic' as const,
                    lineHeight: 1.35,
                    color: t.ink,
                    maxWidth: '36ch',
                    margin: 0,
                    padding: 0,
                }}>
                    {quote}
                </blockquote>

                {/* Attribution */}
                <div style={{ marginTop: '48px' }}>
                    <div style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 600,
                        fontSize: '24px',
                        lineHeight: 1.4,
                        color: t.ink,
                    }}>
                        {author}
                    </div>
                    <div style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '21px',
                        fontWeight: 300,
                        lineHeight: 1.55,
                        color: t.inkDim,
                        marginTop: '6px',
                    }}>
                        {role}
                        {company && `, ${company}`}
                    </div>
                </div>
            </div>
        </KohoSlideChrome>
    )
}

export default QuoteSlideLayout
