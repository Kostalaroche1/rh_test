/** @type {import('tailwindcss').Config} */
export const tailwindConfig = {
  darkMode: 'class', // mode sombre activé via la classe 'dark'
  theme: {
    extend: {
      colors: {
        background: {
          light: '#F9FAFB', // fond clair
          dark: '#111827',  // fond sombre
        },
        primary: {
          DEFAULT: '#4F46E5', // Indigo
          light: '#A5B4FC',
          dark: '#3730A3',
        },
        secondary: {
          DEFAULT: '#EC4899', // Rose
          light: '#FBCFE8',
          dark: '#BE185D',
        },
        text: {
          light: '#111827',
          dark: '#F3F4F6',
        },
        accent: {
          light: '#FBBF24', // Jaune / Or
          dark: '#FACC15',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#93C5FD',
          dark: '#1E40AF',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#6EE7B7',
          dark: '#065F46',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FDE68A',
          dark: '#78350F',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FCA5A5',
          dark: '#B91C1C',
        },
      },
      fontSize: {
        h1: ['3rem', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['2.5rem', { lineHeight: '1.3', fontWeight: '700' }],
        h3: ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
        h4: ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        h5: ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
        h6: ['1rem', { lineHeight: '1.5', fontWeight: '500' }],
        'sm-title': ['0.875rem', { lineHeight: '1.5', fontWeight: '600' }],
        base: ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
      fontWeight: {
        strong: '700',
      },
      borderRadius: {
        card: '1rem',
        full: '9999px',
        btn: '0.75rem',
      },
      boxShadow: {
        card: '0 10px 25px rgba(0,0,0,0.1)',
        btn: '0 4px 14px rgba(0,0,0,0.15)',
      },
      transitionDuration: {
        400: '400ms',
        600: '600ms',
      },
      transitionTimingFunction: {
        'ease-in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)',
      },
    },
  },
  plugins: [],
}
