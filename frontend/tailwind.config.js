/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Obsidian Ledger Design System
        "background": "#0e0e0e",
        "surface": "#0e0e0e",
        "surface-dim": "#0e0e0e",
        "surface-bright": "#2c2c2c",
        "surface-container-lowest": "#000000",
        "surface-container-low": "#131313",
        "surface-container": "#1a1919",
        "surface-container-high": "#201f1f",
        "surface-container-highest": "#262626",
        "surface-variant": "#262626",
        "surface-tint": "#69daff",

        "primary": "#69daff",
        "primary-dim": "#00c0ea",
        "primary-container": "#00cffc",
        "primary-fixed": "#00cffc",
        "primary-fixed-dim": "#00c0ea",

        "secondary": "#e5e2e1",
        "secondary-dim": "#d6d4d3",
        "secondary-container": "#474746",
        "secondary-fixed": "#e5e2e1",
        "secondary-fixed-dim": "#d6d4d3",

        "tertiary": "#89a5ff",
        "tertiary-dim": "#7999ff",
        "tertiary-container": "#7696fd",
        "tertiary-fixed": "#95adff",
        "tertiary-fixed-dim": "#819fff",

        "error": "#ff716c",
        "error-dim": "#d7383b",
        "error-container": "#9f0519",

        "on-surface": "#ffffff",
        "on-surface-variant": "#adaaaa",
        "on-background": "#ffffff",
        "on-primary": "#004a5d",
        "on-primary-container": "#004050",
        "on-primary-fixed": "#002a35",
        "on-primary-fixed-variant": "#004a5c",
        "on-secondary": "#525151",
        "on-secondary-container": "#d2d0cf",
        "on-secondary-fixed": "#403f3f",
        "on-secondary-fixed-variant": "#5c5b5b",
        "on-tertiary": "#00236d",
        "on-tertiary-container": "#001851",
        "on-tertiary-fixed": "#001345",
        "on-tertiary-fixed-variant": "#00318e",
        "on-error": "#490006",
        "on-error-container": "#ffa8a3",

        "outline": "#777575",
        "outline-variant": "#494847",
        "inverse-surface": "#fcf8f8",
        "inverse-on-surface": "#565554",
        "inverse-primary": "#006880",

        // Legacy aliases for backward compat during migration
        "brand": "#0e0e0e",
        "teal": "#69daff",
        "gold": "#89a5ff",
        "accent": "#1a1919",
        "card": "#201f1f",
        "textdark": "#adaaaa",
      },
      fontFamily: {
        headline: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        label: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(105, 218, 255, 0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(105, 218, 255, 0.8)' },
        }
      },
      scale: {
        '98': '0.98',
      }
    },
  },
  plugins: [],
}
