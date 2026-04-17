import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-cta'
export const layoutName = 'Koho Call to Action'
export const layoutDescription = 'A closing call-to-action slide with headline, supporting text, and contact details. Use as the final slide. Include a clear next step. Tone: direct, credible, warm.'

const ctaSchema = z.object({
    headline: z.string().min(3).max(60).default('See it in action').meta({
        description: "Main CTA headline — short and action-oriented",
    }),
    subtitle: z.string().min(0).max(200).default("Start with a free Revenue Assessment. We'll map your data, model your portfolio, and show you what you're leaving on the table.").meta({
        description: "Supporting text below the headline",
    }),
    body: z.string().min(5).max(200).default("Start with a free Revenue Assessment. We'll map your data, model your portfolio, and show you what you're leaving on the table.").meta({
        description: "Supporting body text explaining the next step",
    }),
    ctaLabel: z.string().min(2).max(30).default('Book a demo').meta({
        description: "Label text for the call-to-action button",
    }),
    ctaUrl: z.string().min(5).max(100).default('https://koho.ai').meta({
        description: "URL for the call-to-action (displayed visually, not clickable)",
    }),
    contactName: z.string().min(0).max(60).default('').meta({
        description: "Optional contact person name",
    }),
    contactEmail: z.string().min(0).max(80).default('').meta({
        description: "Optional contact email address",
    }),
})

export const Schema = ctaSchema

type CTAData = z.infer<typeof ctaSchema>

const CTASlideLayout: React.FC<{ data?: Partial<CTAData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)

    const headline = data?.headline || 'See it in action'
    const subtitle = data?.subtitle || ''
    const body = data?.body || "Start with a free Revenue Assessment. We'll map your data, model your portfolio, and show you what you're leaving on the table."
    const ctaLabel = data?.ctaLabel || 'Book a demo'
    const ctaUrl = data?.ctaUrl || 'https://koho.ai'
    const contactName = data?.contactName || ''
    const contactEmail = data?.contactEmail || ''

    return (
        <KohoSlideChrome
            slideNumber="10"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="NEXT STEPS"
            sectionName="NEXT STEPS"
            contourPosition="cover"
            hideHeaderMark={true}
            theme={theme}
        >
            {/* Wordmark */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.logoSrc} alt="Koho" width={300} style={{ height: 'auto' }} />
            </div>

            {/* CTA content — vertically centred */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center' as const,
            }}>
                <h1 style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 300,
                    fontSize: '96px',
                    lineHeight: 1.0,
                    letterSpacing: '-0.025em',
                    color: t.ink,
                }}>
                    {headline}
                </h1>

                {subtitle && (
                    <p style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '23px',
                        fontWeight: 300,
                        lineHeight: 1.5,
                        color: t.inkDim,
                        maxWidth: '54ch',
                        marginTop: '12px',
                    }}>
                        {subtitle}
                    </p>
                )}

                <p style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '27px',
                    fontWeight: 300,
                    lineHeight: 1.55,
                    color: t.inkDim,
                    maxWidth: '42ch',
                    marginTop: '30px',
                }}>
                    {body}
                </p>

                {/* CTA pill button */}
                <div style={{
                    marginTop: '48px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '21px 54px',
                    border: `1px solid ${t.signal}`,
                    borderRadius: '999px',
                }}>
                    <span style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '24px',
                        fontWeight: 500,
                        color: t.signal,
                        letterSpacing: '-0.005em',
                    }}>
                        {ctaLabel}
                    </span>
                    <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '17px',
                        color: t.inkDim,
                    }}>
                        {ctaUrl}
                    </span>
                </div>
            </div>

            {/* Contact details at bottom */}
            {(contactName || contactEmail) && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '36px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '17px',
                    letterSpacing: '0.04em',
                    color: t.inkDim,
                }}>
                    {contactName && <span>{contactName}</span>}
                    {contactEmail && <span style={{ color: t.signal }}>{contactEmail}</span>}
                </div>
            )}
        </KohoSlideChrome>
    )
}

export default CTASlideLayout
