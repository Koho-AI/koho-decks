import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-two-column'
export const layoutName = 'Koho Two Column'
export const layoutDescription = 'A two-column layout with shared title and two content blocks. Use for comparisons, problem/solution, or before/after. Each column has a heading and body text. Tone: direct, credible, warm.'

const twoColumnSchema = z.object({
    title: z.string().min(3).max(80).default('Where you are vs where you could be').meta({
        description: "Shared title above both columns",
    }),
    subtitle: z.string().min(0).max(200).default('').meta({
        description: "Supporting text below the title",
    }),
    leftHeading: z.string().min(2).max(60).default('The problem').meta({
        description: "Heading for the left column",
    }),
    leftBody: z.string().min(5).max(300).default('Your occupancy sits in one system, revenue in another, and risk signals arrive by email — if they arrive at all.').meta({
        description: "Body text for the left column",
    }),
    rightHeading: z.string().min(2).max(60).default('The outcome').meta({
        description: "Heading for the right column",
    }),
    rightBody: z.string().min(5).max(300).default('Koho surfaces every signal in one live view — so you act on facts, not hunches, and close the gap between potential and actual revenue.').meta({
        description: "Body text for the right column",
    }),
})

export const Schema = twoColumnSchema

type TwoColumnData = z.infer<typeof twoColumnSchema>

const TwoColumnSlideLayout: React.FC<{ data?: Partial<TwoColumnData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)

    const title = data?.title || 'Where you are vs where you could be'
    const subtitle = data?.subtitle || ''
    const leftHeading = data?.leftHeading || 'The problem'
    const leftBody = data?.leftBody || 'Your occupancy sits in one system, revenue in another, and risk signals arrive by email — if they arrive at all.'
    const rightHeading = data?.rightHeading || 'The outcome'
    const rightBody = data?.rightBody || 'Koho surfaces every signal in one live view — so you act on facts, not hunches, and close the gap between potential and actual revenue.'

    return (
        <KohoSlideChrome
            slideNumber="03"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="COMPARISON"
            sectionName="COMPARISON"
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
            </div>

            {/* Two columns */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '36px',
                flex: 1,
                minHeight: 0,
                marginTop: '42px',
            }}>
                {/* Left column */}
                <div style={{
                    background: t.bgCard,
                    border: `1px solid ${t.rule2}`,
                    borderLeft: `3px solid ${t.signal}`,
                    padding: '42px',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    gap: '24px',
                }}>
                    <h3 style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 600,
                        fontSize: '30px',
                        lineHeight: 1.25,
                        color: t.ink,
                        letterSpacing: '-0.005em',
                    }}>
                        {leftHeading}
                    </h3>
                    <p style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '23px',
                        fontWeight: 300,
                        lineHeight: 1.6,
                        color: t.inkDim,
                    }}>
                        {leftBody}
                    </p>
                </div>

                {/* Right column */}
                <div style={{
                    background: t.bgCard,
                    border: `1px solid ${t.rule2}`,
                    borderLeft: `3px solid ${t.signal}`,
                    padding: '42px',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    gap: '24px',
                }}>
                    <h3 style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 600,
                        fontSize: '30px',
                        lineHeight: 1.25,
                        color: t.ink,
                        letterSpacing: '-0.005em',
                    }}>
                        {rightHeading}
                    </h3>
                    <p style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '23px',
                        fontWeight: 300,
                        lineHeight: 1.6,
                        color: t.inkDim,
                    }}>
                        {rightBody}
                    </p>
                </div>
            </div>
        </KohoSlideChrome>
    )
}

export default TwoColumnSlideLayout
