/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#0B0E14",      // Deep space black/blue for the main background
        surface: "#151A24",    // Mildly elevated surface color
        card: "#1C2433",       // Elevated card background
        accent: "#1A3A5A",     // Soft blue accent for secondary elements
        teal: "#00E5FF",       // Vibrant neon cyan/teal for pure contrast
        gold: "#FFB000",       // Bright gold for rewards and highlights
        textdark: "#A0AEC0",   // Slate-400 equivalent for softer text
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
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
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 229, 255, 0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 229, 255, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
