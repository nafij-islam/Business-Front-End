import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          primary: 'var(--theme-primary, #0d9488)',
          'primary-hover': 'var(--theme-primary-hover, #0f766e)',
          secondary: 'var(--theme-secondary, #0e7490)',
          sidebar: 'var(--theme-sidebar, #0f172a)',
          accent: 'var(--theme-accent, #10b981)',
        },
        background: 'var(--background, #f8fafc)',
        foreground: 'var(--foreground, #0f172a)',
        card: {
          DEFAULT: 'var(--card, #ffffff)',
          foreground: 'var(--card-foreground, #0f172a)',
        },
        muted: {
          DEFAULT: '#f1f5f9',
          foreground: '#64748b',
        },
        border: '#e2e8f0',
      },
      borderRadius: {
        lg: '0.625rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
    },
  },
  plugins: [],
};

export default config;
