/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--page)', panel: 'var(--panel)', 'panel-2': 'var(--panel-2)',
        ink: 'var(--ink)', 'ink-2': 'var(--ink-2)', 'ink-3': 'var(--ink-3)',
        hairline: 'var(--hairline)', 'hairline-strong': 'var(--hairline-strong)',
        agua: 'var(--agua)',
        bajo: 'var(--bajo)', medio: 'var(--medio)', alto: 'var(--alto)', 'muy-alto': 'var(--muy-alto)',
        'bajo-bg': 'var(--bajo-bg)', 'medio-bg': 'var(--medio-bg)',
        'alto-bg': 'var(--alto-bg)', 'muy-alto-bg': 'var(--muy-alto-bg)',
        track: 'var(--track)',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', '"Arial Narrow"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
