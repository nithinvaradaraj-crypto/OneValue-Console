/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple System Colors (via CSS variables)
        apple: {
          red: 'rgb(var(--color-red))',
          orange: 'rgb(var(--color-orange))',
          green: 'rgb(var(--color-green))',
          blue: 'rgb(var(--color-blue))',
        },
        // Corporate Blue - Primary brand color
        primary: {
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#C7DFFF',
          300: '#A4CCFF',
          400: '#7EB3FF',
          500: '#4D94FF',
          600: '#0066CC',
          700: '#0052A3',
          800: '#003D7A',
          900: '#002B57',
          950: '#001A3D',
          DEFAULT: '#0066CC',
        },
        // Health status colors
        health: {
          healthy: 'rgb(var(--color-green))',
          'healthy-light': '#34D399',
          risk: 'rgb(var(--color-orange))',
          'risk-light': '#FBBF24',
          critical: 'rgb(var(--color-red))',
          'critical-light': '#F87171',
          unknown: '#6B7280',
        },
        // Semantic colors
        success: {
          DEFAULT: 'rgb(var(--color-green))',
          light: '#34D399',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-orange))',
          light: '#FBBF24',
        },
        error: {
          DEFAULT: 'rgb(var(--color-red))',
          light: '#F87171',
        },
        // Background colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        border: 'hsl(var(--border))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        'DEFAULT': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'md': '0 8px 24px rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        'xl': '0 20px 60px rgba(0, 0, 0, 0.15)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        'glass-lg': '0 20px 60px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        'glow-red': '0 0 30px rgba(var(--color-red), 0.3)',
        'glow-orange': '0 0 30px rgba(var(--color-orange), 0.3)',
        'glow-green': '0 0 30px rgba(var(--color-green), 0.3)',
        'glow-blue': '0 0 30px rgba(var(--color-blue), 0.3)',
      },
      fontFamily: {
        display: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Segoe UI',
          'sans-serif',
        ],
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Segoe UI',
          'sans-serif',
        ],
        mono: [
          'SF Mono',
          'Menlo',
          'Monaco',
          'Courier New',
          'monospace',
        ],
      },
      fontSize: {
        /* Apple Typography Scale */
        'micro': ['11px', { lineHeight: '1.2', letterSpacing: '0em', fontWeight: '500' }],
        'caption': ['13px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '500' }],
        'body-sm': ['14px', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '400' }],
        'body': ['15px', { lineHeight: '1.5', letterSpacing: '-0.01em', fontWeight: '400' }],
        'body-lg': ['17px', { lineHeight: '1.5', letterSpacing: '-0.01em', fontWeight: '500' }],
        'headline': ['20px', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '600' }],
        'title-sm': ['24px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'title': ['34px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'title-lg': ['40px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'hero': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'hero-lg': ['56px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'metric': ['64px', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '600' }],
      },
      letterSpacing: {
        'tighter': '-0.03em',
        'tight': '-0.02em',
        'normal': '-0.01em',
        'wide': '0em',
      },
      lineHeight: {
        'tight': '1.1',
        'snug': '1.25',
        'normal': '1.5',
        'relaxed': '1.625',
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'counter-pop': 'counterPop 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        counterPop: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 69, 58, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 69, 58, 0.5)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
}
