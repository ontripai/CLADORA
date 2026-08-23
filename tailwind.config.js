/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cladora: {
          navy: {
            DEFAULT: '#102A43',
            deep: '#0B2239',
            strong: '#173F5F',
            light: '#243B53',
          },
          teal: {
            DEFAULT: '#0E9F8E',
            hover: '#0C8778',
            light: '#EAF8F5',
            border: '#B2E5DF',
          },
          emerald: {
            DEFAULT: '#10B981',
            light: '#ECFDF5',
            dark: '#059669',
          },
          sky: {
            DEFAULT: '#2F80ED',
            light: '#EDF5FF',
            dark: '#1E62C4',
          },
          coral: {
            DEFAULT: '#FF7A59',
            light: '#FFF0EB',
            hover: '#F2633F',
          },
          amber: {
            DEFAULT: '#F5B942',
            light: '#FFF7E6',
            dark: '#D99B26',
          },
          bg: {
            DEFAULT: '#F6F9FC',
            subtle: '#F0F4F8',
            card: '#FFFFFF',
            dark: '#0B2239',
          },
          text: {
            primary: '#102A43',
            secondary: '#52667A',
            muted: '#7B8A9A',
            dark: '#F7FAFC',
          },
          border: {
            subtle: '#E2E8F0',
            DEFAULT: '#D3DCE6',
            strong: '#BCCCDC',
          }
        },
        // Maintain backwards compatibility aliases where needed
        brand: {
          50: '#EAF8F5',
          100: '#D5F2ED',
          200: '#B2E5DF',
          300: '#75CFC3',
          400: '#38B8A7',
          500: '#0E9F8E',
          600: '#0C8778',
          700: '#0A6E62',
          800: '#08554C',
          900: '#102A43',
          DEFAULT: '#0E9F8E',
        },
        surface: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          800: '#173F5F',
          900: '#102A43',
          950: '#0B2239',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-manrope)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        vazirmatn: ['var(--font-vazirmatn)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'card': '0 2px 8px -1px rgba(16, 42, 67, 0.06), 0 1px 3px -1px rgba(16, 42, 67, 0.04)',
        'card-hover': '0 12px 24px -4px rgba(16, 42, 67, 0.08), 0 4px 8px -2px rgba(16, 42, 67, 0.04)',
        'elevated': '0 20px 35px -8px rgba(16, 42, 67, 0.12), 0 8px 16px -4px rgba(16, 42, 67, 0.06)',
        'glow-teal': '0 0 20px rgba(14, 159, 142, 0.25)',
        'glow-coral': '0 0 20px rgba(255, 122, 89, 0.25)',
        'glow-sky': '0 0 20px rgba(47, 128, 237, 0.25)',
      }
    },
  },
  plugins: [],
}
