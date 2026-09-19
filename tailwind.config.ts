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
        primary: {
          DEFAULT: 'var(--theme-primary, #0d9488)',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: 'var(--theme-secondary, #0e7490)',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: 'var(--theme-accent, #10b981)',
          foreground: '#ffffff',
        },
        background: 'var(--background, #f8fafc)',
        foreground: 'var(--foreground, #0f172a)',
        card: {
          DEFAULT: 'var(--card, #ffffff)',
          foreground: 'var(--card-foreground, #0f172a)',
        },
        muted: {
          DEFAULT: 'var(--muted, #f1f5f9)',
          foreground: 'var(--muted-foreground, #64748b)',
        },
        border: 'var(--border, #e2e8f0)',
        input: 'var(--input, #e2e8f0)',
        ring: 'var(--ring, #0d9488)',
        success: {
          DEFAULT: 'var(--success, #16a34a)',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: 'var(--warning, #d97706)',
          foreground: '#ffffff',
        },
        danger: {
          DEFAULT: 'var(--danger, #dc2626)',
          foreground: '#ffffff',
        },
        info: {
          DEFAULT: 'var(--info, #2563eb)',
          foreground: '#ffffff',
        },
      },
      borderRadius: {
        xl: 'var(--radius-xl, 1rem)',
        lg: 'var(--radius-lg, 0.75rem)',
        md: 'var(--radius-md, 0.5rem)',
        sm: 'var(--radius-sm, 0.375rem)',
      },
    },
  },
  plugins: [],
};

export default config;
