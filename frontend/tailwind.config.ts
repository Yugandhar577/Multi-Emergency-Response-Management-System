import type { Config } from 'tailwindcss';

// Indian Insite Editorial — locked theme.
// Tokens map to CSS variables defined in src/index.css for runtime theme switching.
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--c-paper) / <alpha-value>)',
        parchment: 'rgb(var(--c-parchment) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        brass: 'rgb(var(--c-brass) / <alpha-value>)',
        moss: 'rgb(var(--c-moss) / <alpha-value>)',
        ruby: 'rgb(var(--c-ruby) / <alpha-value>)',
        mist: 'rgb(var(--c-mist) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        body: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.025em',
      },
      boxShadow: {
        editorial: '0 1px 0 rgb(var(--c-mist)), 0 12px 30px -20px rgb(var(--c-ink) / 0.18)',
        inset: 'inset 0 0 0 1px rgb(var(--c-mist))',
      },
      backgroundImage: {
        grain: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.06'/></svg>\")",
      },
    },
  },
  plugins: [],
};

export default config;
