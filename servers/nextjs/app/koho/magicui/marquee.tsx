import React from 'react';

// Minimal marquee stub — renders children in a static row.
// Sufficient for slide rendering where CSS animations are irrelevant.
export default function Marquee({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  vertical?: boolean;
  repeat?: number;
}) {
  return (
    <div className={className} style={{ display: 'flex', gap: '1rem', overflow: 'hidden' }}>
      {children}
    </div>
  );
}
