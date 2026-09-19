/* ============================================================
   Tailwind configuration (Play CDN)
   Color values come from CSS variables defined in css/styles.css,
   so light/dark and rebranding are handled in one place.
   If you later compile Tailwind, move this object into tailwind.config.js
   at the project root and add a `content` array pointing at index.html and the js folder.
   ============================================================ */
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        accent: {
          50:  'rgb(var(--accent-50) / <alpha-value>)',
          100: 'rgb(var(--accent-100) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
          700: 'rgb(var(--accent-700) / <alpha-value>)',
          900: 'rgb(var(--accent-900) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          raised:  'rgb(var(--surface-raised) / <alpha-value>)',
          sunken:  'rgb(var(--surface-sunken) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          soft:    'rgb(var(--ink-soft) / <alpha-value>)',
          faint:   'rgb(var(--ink-faint) / <alpha-value>)',
        },
        line: 'rgb(var(--line) / <alpha-value>)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgb(20 24 26 / 0.04), 0 8px 24px -12px rgb(20 24 26 / 0.12)',
        lift: '0 2px 4px rgb(20 24 26 / 0.06), 0 20px 40px -16px rgb(20 24 26 / 0.22)',
      },
      maxWidth: { content: '72rem' },
    },
  },
};
