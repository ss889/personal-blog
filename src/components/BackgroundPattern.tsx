'use client';

import { useEffect, useMemo, useRef, type CSSProperties } from 'react';

type ThemeId = 'theme-night' | 'theme-ink' | 'theme-terminal';

const INK_PATTERN = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='280' viewBox='0 0 400 280'%3E%3Cg fill='%23111111' opacity='0.25' font-family='monospace' font-size='11'%3E%3Ctext x='20' y='30'%3E%3Cbody%3E%3C/text%3E%3Ctext x='40' y='52'%3E%3Ch1%3E%3C/text%3E%3Ctext x='60' y='74'%3EHello World%3C/text%3E%3Ctext x='40' y='96'%3E%3C/h1%3E%3C/text%3E%3Ctext x='40' y='118'%3E%3Cdiv class='container'%3E%3C/text%3E%3Ctext x='60' y='140'%3E%3Cp%3E%3C/text%3E%3Ctext x='80' y='162'%3ESome content here%3C/text%3E%3Ctext x='60' y='184'%3E%3C/p%3E%3C/text%3E%3Ctext x='60' y='206'%3E%3Cspan%3EOops. Hello World!%3C/span%3E%3C/text%3E%3Ctext x='40' y='228'%3E%3C/div%3E%3C/text%3E%3Ctext x='20' y='250'%3E%3C/body%3E%3C/text%3E%3C/g%3E%3C/svg%3E`;

const TERMINAL_PATTERN = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Cg fill='%2322c55e' opacity='0.24' font-family='Space Mono, monospace' font-size='16'%3E%3Ctext x='18' y='28'%3E1%3C/text%3E%3Ctext x='92' y='18'%3E0%3C/text%3E%3Ctext x='168' y='44'%3E1%3C/text%3E%3Ctext x='236' y='26'%3E0%3C/text%3E%3Ctext x='40' y='76'%3E0%3C/text%3E%3Ctext x='124' y='70'%3E1%3C/text%3E%3Ctext x='214' y='92'%3E0%3C/text%3E%3Ctext x='286' y='84'%3E1%3C/text%3E%3Ctext x='20' y='132'%3E1%3C/text%3E%3Ctext x='108' y='118'%3E0%3C/text%3E%3Ctext x='184' y='144'%3E1%3C/text%3E%3Ctext x='258' y='130'%3E0%3C/text%3E%3Ctext x='56' y='178'%3E1%3C/text%3E%3Ctext x='146' y='170'%3E0%3C/text%3E%3Ctext x='230' y='184'%3E1%3C/text%3E%3C/g%3E%3C/svg%3E`;

function getThemeClass(): ThemeId {
  if (typeof document === 'undefined') return 'theme-night';
  const root = document.documentElement;
  if (root.classList.contains('theme-ink')) return 'theme-ink';
  if (root.classList.contains('theme-terminal')) return 'theme-terminal';
  return 'theme-night';
}

function getPatternStyles(theme: ThemeId): CSSProperties {
  switch (theme) {
    case 'theme-ink':
      return {
        backgroundImage: `url("${INK_PATTERN}")`,
        backgroundSize: '400px 280px',
        opacity: 0.06,
      };
    case 'theme-terminal':
      return {
        backgroundImage: `url("${TERMINAL_PATTERN}")`,
        backgroundSize: '300px 200px',
        opacity: 0.03,
      };
    case 'theme-night':
    default:
      return {
        backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        opacity: 0.04,
      };
  }
}

export default function BackgroundPattern() {
  const ref = useRef<HTMLDivElement | null>(null);

  const applyThemeStyles = useMemo(() => {
    return () => {
      const theme = getThemeClass();
      const el = ref.current;
      if (!el) return;
      const styles = getPatternStyles(theme);
      Object.assign(el.style, {
        backgroundImage: styles.backgroundImage,
        backgroundSize: styles.backgroundSize,
        opacity: String(styles.opacity),
      });
    };
  }, []);

  useEffect(() => {
    applyThemeStyles();

    const observer = new MutationObserver(() => {
      applyThemeStyles();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [applyThemeStyles]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0',
        backgroundAttachment: 'fixed',
      }}
    />
  );
}
