import React from 'react'
import * as z from "zod"
import KohoSlideChrome from './KohoSlideChrome'
import { getTheme, type ThemeMode } from './theme'

export const layoutId = 'koho-team'
export const layoutName = 'Koho Team'
export const layoutDescription = 'A team slide showing 3-5 members with circular photos (or initials fallback), names, roles, and one-line descriptions. Use for team introductions or leadership pages. Tone: direct, credible, warm.'

const memberSchema = z.object({
    name: z.string().min(2).max(40).default('Team Member').meta({
        description: "Full name of the team member",
    }),
    role: z.string().min(2).max(40).default('Role').meta({
        description: "Job title or role",
    }),
    description: z.string().min(0).max(120).default('').meta({
        description: "One-sentence description of what this person does",
    }),
    imageUrl: z.string().min(0).max(500).default('').meta({
        description: "URL to a headshot photo. Leave empty for initials fallback.",
    }),
})

const teamSchema = z.object({
    title: z.string().min(3).max(60).default('Meet the team').meta({
        description: "Slide title",
    }),
    subtitle: z.string().min(0).max(200).default('The people behind the platform.').meta({
        description: "Supporting text below the title",
    }),
    members: z.array(memberSchema).min(3).max(5).default([
        { name: 'Sarah Chen', role: 'CEO & Co-founder', description: 'Revenue operations leader with 15 years in flex workspace.', imageUrl: '' },
        { name: 'James Wright', role: 'CTO', description: 'Built data platforms at scale for three SaaS companies.', imageUrl: '' },
        { name: 'Maria Garcia', role: 'Head of Product', description: 'Designed tools operators actually want to use.', imageUrl: '' },
        { name: 'Daniel Okafor', role: 'Head of Customer Success', description: 'Ensures every operator sees value within six weeks.', imageUrl: '' },
        { name: 'Anna Robertson', role: 'Head of Sales', description: 'Connects operators to the revenue clarity they need.', imageUrl: '' },
    ]).meta({
        description: "Array of 3-5 team members with name, role, description, and optional photo URL",
    }),
})

export const Schema = teamSchema

type TeamData = z.infer<typeof teamSchema>

function getInitials(name: string): string {
    return name.split(' ').map(w => w.charAt(0).toUpperCase()).join('').slice(0, 2)
}

const TeamSlideLayout: React.FC<{ data?: Partial<TeamData> }> = ({ data }) => {
    const theme: ThemeMode = ((data as any)?.__theme__ === 'light') ? 'light' : 'dark'
    const t = getTheme(theme)

    const title = data?.title || 'Meet the team'
    const subtitle = data?.subtitle || 'The people behind the platform.'
    const members = (data?.members || [
        { name: 'Sarah Chen', role: 'CEO & Co-founder', description: 'Revenue operations leader with 15 years in flex workspace.', imageUrl: '' },
        { name: 'James Wright', role: 'CTO', description: 'Built data platforms at scale for three SaaS companies.', imageUrl: '' },
        { name: 'Maria Garcia', role: 'Head of Product', description: 'Designed tools operators actually want to use.', imageUrl: '' },
        { name: 'Daniel Okafor', role: 'Head of Customer Success', description: 'Ensures every operator sees value within six weeks.', imageUrl: '' },
        { name: 'Anna Robertson', role: 'Head of Sales', description: 'Connects operators to the revenue clarity they need.', imageUrl: '' },
    ]).filter(m => m.name && m.name.trim().length > 0)

    return (
        <KohoSlideChrome
            slideNumber="07"
            dynamicIndex={(data as any)?.__slideIndex__}
            chapterLabel="TEAM"
            metaRight="PEOPLE · LEADERSHIP"
            sectionName="TEAM"
            contourPosition="mark"
            theme={theme}
        >
            {/* Title area with dashed separator */}
            <div style={{
                borderBottom: `1px dashed ${t.ruleStrong}`,
                paddingBottom: '27px',
                marginBottom: '42px',
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

            {/* Team members grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(members.length, 5)}, 1fr)`,
                gap: '30px',
                flex: 1,
                minHeight: 0,
                alignItems: 'start',
            }}>
                {members.map((member, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        flexDirection: 'column' as const,
                        alignItems: 'center',
                        textAlign: 'center' as const,
                        gap: '18px',
                    }}>
                        {/* Photo or initials */}
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            background: member.imageUrl ? 'transparent' : t.bgChrome,
                            border: member.imageUrl ? `3px solid ${t.rule2}` : `1px solid ${t.signalEdge}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            {member.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={member.imageUrl}
                                    alt={member.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <span style={{
                                    fontFamily: "'Manrope', sans-serif",
                                    fontSize: '36px',
                                    fontWeight: 600,
                                    color: t.signal,
                                }}>
                                    {getInitials(member.name)}
                                </span>
                            )}
                        </div>

                        {/* Name */}
                        <span style={{
                            fontFamily: "'Manrope', sans-serif",
                            fontSize: '24px',
                            fontWeight: 600,
                            color: t.ink,
                        }}>
                            {member.name}
                        </span>

                        {/* Role */}
                        <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '15px',
                            fontWeight: 400,
                            color: t.signal,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase' as const,
                            marginTop: '-9px',
                        }}>
                            {member.role}
                        </span>

                        {/* Description */}
                        {member.description && (
                            <p style={{
                                fontFamily: "'Manrope', sans-serif",
                                fontSize: '20px',
                                fontWeight: 300,
                                lineHeight: 1.45,
                                color: t.inkDim,
                                maxWidth: '20ch',
                            }}>
                                {member.description}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </KohoSlideChrome>
    )
}

export default TeamSlideLayout
