import React from 'react'
import { getTheme, type ThemeMode } from './theme'

/**
 * ShowcaseMockup — Reusable wrapper that renders any showcase component
 * inside a browser-chrome frame, positioned to bleed off the bottom-right
 * edge of the slide body. Matches the Koho website hero treatment.
 */

interface ShowcaseMockupProps {
    children: React.ReactNode;
    width?: string;
    topOffset?: string;
    contentScale?: number;
    /** Theme mode: 'dark' (default) or 'light' */
    theme?: ThemeMode;
}

export default function ShowcaseMockup({
    children,
    width = '72%',
    topOffset = '-1%',
    contentScale = 1.5,
    theme,
}: ShowcaseMockupProps) {
    const t = getTheme(theme)
    const isLight = t.mode === 'light'
    const inverseScale = Math.round((1 / contentScale) * 100);

    // Frame & chrome colours depend on theme
    const frameBg = isLight ? '#FFFFFF' : '#161E2A'
    const chromeBarBg = isLight ? '#F4F6F9' : '#1A2332'
    const chromeBorder = isLight ? 'rgba(26,35,50,0.08)' : 'rgba(255,255,255,0.06)'
    const frameBorder = isLight ? 'rgba(26,35,50,0.10)' : 'rgba(255,255,255,0.10)'
    const frameShadow = isLight
        ? '0 30px 100px -20px rgba(26,35,50,0.25), 0 0 0 1px rgba(0,194,120,0.04)'
        : '0 30px 100px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,229,138,0.03)'
    const addressBarBg = isLight ? 'rgba(26,35,50,0.06)' : 'rgba(255,255,255,0.06)'

    return (
        <div style={{
            position: 'absolute',
            top: topOffset,
            right: '-270px',
            bottom: '-48px',
            width,
            zIndex: 2,
        }}>
            {/* Browser chrome frame */}
            <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '24px 0 0 0',
                overflow: 'hidden',
                background: frameBg,
                border: `1px solid ${frameBorder}`,
                borderRight: 'none',
                borderBottom: 'none',
                boxShadow: frameShadow,
                display: 'flex',
                flexDirection: 'column' as const,
            }}>
                {/* Browser chrome bar */}
                <div style={{
                    height: '48px',
                    background: chromeBarBg,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 21px',
                    gap: '12px',
                    flexShrink: 0,
                    borderBottom: `1px solid ${chromeBorder}`,
                }}>
                    {/* Traffic lights — consistent across themes */}
                    <div style={{ display: 'flex', gap: '9px' }}>
                        <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#FF5F56' }} />
                        <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#FFBD2E' }} />
                        <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#27C93F' }} />
                    </div>
                    {/* Address bar */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                    }}>
                        <div style={{
                            background: addressBarBg,
                            borderRadius: '9px',
                            padding: '6px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '9px',
                        }}>
                            <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: t.signal,
                                flexShrink: 0,
                            }} />
                            <span style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '15px',
                                color: t.inkDim,
                                letterSpacing: '0.02em',
                            }}>
                                app.koho.ai
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content area — scaled down to fit, with theme CSS variables injected */}
                <div
                    className={isLight ? 'light' : 'dark'}
                    style={{
                        flex: 1,
                        overflow: 'hidden',
                        position: 'relative',
                        ...t.cssVars,
                    } as React.CSSProperties}
                >
                    <div style={{
                        width: `${inverseScale}%`,
                        height: `${inverseScale}%`,
                        transform: `scale(${contentScale})`,
                        transformOrigin: 'top left',
                    }}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
