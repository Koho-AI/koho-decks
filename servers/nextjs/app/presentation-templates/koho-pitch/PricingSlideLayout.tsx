import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-pricing'
export const layoutName = 'Koho Pricing'
export const layoutDescription = 'A pricing comparison slide with 2-3 tier cards showing plan name, price, description, and feature bullets. Keep pricing language simple and transparent. No asterisks or hidden conditions. Tone: direct, credible, warm.'

const tierSchema = z.object({
    name: z.string().min(1).max(30).meta({
        description: "Plan or tier name, e.g. 'Starter', 'Growth', 'Enterprise'.",
    }),
    price: z.string().min(1).max(20).meta({
        description: "Price label, e.g. '£299/mo' or 'Custom'.",
    }),
    description: z.string().min(5).max(120).meta({
        description: "One-sentence description of what this tier offers.",
    }),
    features: z.array(z.string().min(1).max(80)).min(3).max(5).meta({
        description: "List of 3-5 feature bullet strings included in this tier.",
    }),
    highlighted: z.boolean().default(false).meta({
        description: "Whether this tier is the recommended / highlighted option.",
    }),
})

const schema = z.object({
    title: z.string().min(3).max(80).default('Simple, transparent pricing.').meta({
        description: "Main statement text — bold, direct, outcome-focused.",
    }),
subtitle: z.string().min(5).max(200).default('No hidden fees. No per-seat charges. One platform, one price.').meta({
        description: "Supporting subtitle — one or two sentences below the title",
    }),
    tiers: z.array(tierSchema).min(2).max(3).default([
        {
            name: 'Starter',
            price: '£299/mo',
            description: 'For single-site operators getting started with revenue intelligence.',
            features: [
                'Up to 3 buildings',
                'Core dashboard & alerts',
                'Monthly revenue reports',
            ],
            highlighted: false,
        },
        {
            name: 'Growth',
            price: '£799/mo',
            description: 'For growing portfolios that need pipeline and risk visibility.',
            features: [
                'Up to 15 buildings',
                'Pipeline & waterfall analytics',
                'Risk signals & break clause alerts',
                'Priority support',
            ],
            highlighted: true,
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            description: 'For large operators needing full API access and dedicated support.',
            features: [
                'Unlimited buildings',
                'Full API & integrations',
                'Dedicated success manager',
                'Custom reporting & SLAs',
                'SSO & advanced security',
            ],
            highlighted: false,
        },
    ]).meta({
        description: "Array of 2-3 pricing tiers to display as cards.",
    }),
})

export const Schema = schema

type SlideData = z.infer<typeof schema>

const PricingSlideLayout: React.FC<{ data?: Partial<SlideData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)

    const dashedSeparatorStyle: React.CSSProperties = {
        backgroundImage:
            `linear-gradient(to right, ${t.rule} 0px, ${t.rule} 12px, transparent 12px, transparent 21px)`,
        backgroundRepeat: 'repeat-x',
        backgroundSize: '21px 1px',
        backgroundPositionY: 'bottom',
        paddingBottom: '36px',
        marginBottom: '42px',
    }

    const title = data?.title || 'Simple, transparent pricing.'
    const subtitle = data?.subtitle || 'No hidden fees. No per-seat charges. One platform, one price.'
    const tiers = data?.tiers || [
        { name: 'Starter', price: '£299/mo', description: 'For single-location operators getting started with RevOps.', features: ['1 location', 'Core dashboards', 'PMS integration', 'Email support'], highlighted: false },
        { name: 'Growth', price: '£599/mo', description: 'For multi-site operators ready to scale with confidence.', features: ['Up to 5 locations', 'Full analytics suite', 'All integrations', 'Risk signals', 'Priority support'], highlighted: true },
        { name: 'Enterprise', price: 'Custom', description: 'For portfolios that need dedicated infrastructure and SLAs.', features: ['Unlimited locations', 'Custom dashboards', 'API access', 'Dedicated CSM', 'SLA guarantee'], highlighted: false },
    ]

    return (
        <KohoSlideChrome
            slideNumber="05"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="PRICING"
            metaRight="PLANS · COMPARISON"
            sectionName="PRICING"
            contourPosition="mark"
            theme={theme}
        >
            <div style={{
                position: 'relative',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column' as const,
            }}>
                {/* Title area with dashed separator */}
                <div style={dashedSeparatorStyle}>
                    <h2 style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 300,
                        fontSize: '72px',
                        lineHeight: 0.96,
                        letterSpacing: '-0.025em',
                        color: t.ink,
                        marginBottom: '18px',
                    }}>
                        {title}
                    </h2>
                    <p style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '23px',
                        fontWeight: 300,
                        lineHeight: 1.5,
                        color: t.inkDim,
                        maxWidth: '54ch',
                    }}>
                        {subtitle}
                    </p>
                </div>

                {/* Tier cards grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${tiers.length}, 1fr)`,
                    gap: '30px',
                    flex: 1,
                    minHeight: 0,
                }}>
                    {tiers.map((tier, i) => (
                        <div
                            key={i}
                            style={{
                                background: tier.highlighted
                                    ? `radial-gradient(ellipse at top center, ${t.signalTint} 0%, ${t.bgCard} 70%)`
                                    : t.bgCard,
                                border: tier.highlighted
                                    ? `1px solid ${t.signal}`
                                    : `1px solid ${t.rule2}`,
                                borderRadius: '18px',
                                padding: '36px',
                                display: 'flex',
                                flexDirection: 'column' as const,
                            }}
                        >
                            {/* Plan name */}
                            <span style={{
                                fontFamily: "'Manrope', sans-serif",
                                fontSize: '27px',
                                fontWeight: 600,
                                color: t.ink,
                                marginBottom: '12px',
                            }}>
                                {tier.name}
                            </span>

                            {/* Price */}
                            <span style={{
                                fontFamily: "'Manrope', sans-serif",
                                fontSize: '72px',
                                fontWeight: 300,
                                color: t.signal,
                                lineHeight: 1.1,
                                marginBottom: '15px',
                            }}>
                                {tier.price}
                            </span>

                            {/* Description */}
                            <p style={{
                                fontFamily: "'Manrope', sans-serif",
                                fontSize: '20px',
                                fontWeight: 400,
                                lineHeight: 1.5,
                                color: t.inkDim,
                                marginBottom: '30px',
                            }}>
                                {tier.description}
                            </p>

                            {/* Features list — ul/li so gaps close when items are removed */}
                            <ul style={{
                                listStyle: 'none',
                                margin: 0,
                                padding: 0,
                                display: 'flex',
                                flexDirection: 'column' as const,
                                gap: '12px',
                            }}>
                                {tier.features.filter(f => f && f.trim().length > 0).map((feature, j) => (
                                    <li key={j} style={{
                                        fontFamily: "'Manrope', sans-serif",
                                        fontSize: '20px',
                                        fontWeight: 400,
                                        lineHeight: 1.45,
                                        color: t.ink,
                                        paddingLeft: '27px',
                                        position: 'relative' as const,
                                    }}>
                                        {/* Green triangle bullet via positioned pseudo-element equivalent */}
                                        <span style={{
                                            position: 'absolute' as const,
                                            left: 0,
                                            top: '8px',
                                            width: 0,
                                            height: 0,
                                            borderLeft: '8px solid transparent',
                                            borderRight: '8px solid transparent',
                                            borderBottom: `11px solid ${t.signal}`,
                                            transform: 'rotate(90deg)',
                                        }} />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </KohoSlideChrome>
    )
}

export default PricingSlideLayout
