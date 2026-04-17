import { useRef } from 'react';

// Minimal stub — returns formatted value immediately without animation.
export function useCountUp(options: {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);
  const formatted = `${options.prefix ?? ''}${options.end.toLocaleString()}${options.suffix ?? ''}`;
  return { ref, display: formatted };
}

export default useCountUp;
