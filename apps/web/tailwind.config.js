/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			// CRYONEL Professional Theme - MetaMask-inspired with unique colors
  			'brand-bg': 'var(--brand-bg)',
  			'brand-card': 'var(--brand-card)',
  			'brand-border': 'var(--brand-border)',
  			'brand-text': 'var(--brand-text)',
  			'brand-muted': 'var(--brand-muted)',
  			'brand-accent': 'var(--brand-accent)',
  			'brand-accent-2': 'var(--brand-accent-2)',
  			
  			// MetaMask-inspired system colors
  			border: 'hsl(var(--border))',
  			'border-hover': 'hsl(var(--border-hover))',
  			
  			// Professional background layers
  			background: 'hsl(var(--background))',
  			'surface-primary': 'hsl(var(--surface-primary))',
  			'surface-secondary': 'hsl(var(--surface-secondary))',
  			'surface-tertiary': 'hsl(var(--surface-tertiary))',
  			'surface-elevated': 'hsl(var(--surface-elevated))',
  			
  			// Professional text system
  			foreground: 'hsl(var(--foreground))',
  			'foreground-muted': 'hsl(var(--foreground-muted))',
  			'foreground-subtle': 'hsl(var(--foreground-subtle))',
  			'foreground-disabled': 'hsl(var(--foreground-disabled))',
  			
  			// Legacy compatibility
  			bg: {
  				'0': 'hsl(var(--bg-0))',
  				'1': 'hsl(var(--bg-1))'
  			},
  			surf: {
  				'0': 'hsl(var(--surf-0))',
  				'1': 'hsl(var(--surf-1))'
  			},
  			text: {
  				hi: 'hsl(var(--text-hi))',
  				low: 'hsl(var(--text-low))'
  			},
  			
  			// CRYONEL Brand colors (unique from MetaMask)
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))',
  				50: '#F0F9FF',
  				100: '#E0F2FE',
  				200: '#BAE6FD',
  				300: '#7DD3FC',
  				400: '#38BDF8',
  				500: '#0EA5E9',
  				600: '#0284C7',
  				700: '#0369A1',
  				800: '#075985',
  				900: '#0C4A6E',
  				950: '#082F49'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))',
  				50: '#FDF4FF',
  				100: '#FAE8FF',
  				200: '#F5D0FE',
  				300: '#F0ABFC',
  				400: '#E879F9',
  				500: '#D946EF',
  				600: '#C026D3',
  				700: '#A21CAF',
  				800: '#86198F',
  				900: '#701A75',
  				950: '#4A044E'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))',
  				cyan: '#06B6D4',
  				violet: '#7C3AED',
  				teal: '#14B8A6',
  				emerald: '#10B981'
  			},
  			
  			// Professional status colors
  			success: {
  				DEFAULT: '#10B981',
  				foreground: 'hsl(var(--success-foreground))',
  				50: '#ECFDF5',
  				100: '#D1FAE5',
  				200: '#A7F3D0',
  				300: '#6EE7B7',
  				400: '#34D399',
  				500: '#10B981',
  				600: '#059669',
  				700: '#047857',
  				800: '#065F46',
  				900: '#064E3B'
  			},
  			warning: {
  				DEFAULT: '#F59E0B',
  				foreground: 'hsl(var(--warning-foreground))',
  				50: '#FFFBEB',
  				100: '#FEF3C7',
  				200: '#FDE68A',
  				300: '#FCD34D',
  				400: '#FBBF24',
  				500: '#F59E0B',
  				600: '#D97706',
  				700: '#B45309',
  				800: '#92400E',
  				900: '#78350F'
  			},
  			error: {
  				DEFAULT: '#EF4444',
  				foreground: 'hsl(var(--error-foreground))',
  				50: '#FEF2F2',
  				100: '#FEE2E2',
  				200: '#FECACA',
  				300: '#FCA5A5',
  				400: '#F87171',
  				500: '#EF4444',
  				600: '#DC2626',
  				700: '#B91C1C',
  				800: '#991B1B',
  				900: '#7F1D1D'
  			},
  			danger: {
  				DEFAULT: '#EF4444',
  				foreground: 'hsl(var(--error-foreground))'
  			},
  			info: {
  				DEFAULT: '#3B82F6',
  				foreground: 'hsl(var(--info-foreground))',
  				50: '#EFF6FF',
  				100: '#DBEAFE',
  				200: '#BFDBFE',
  				300: '#93C5FD',
  				400: '#60A5FA',
  				500: '#3B82F6',
  				600: '#2563EB',
  				700: '#1D4ED8',
  				800: '#1E40AF',
  				900: '#1E3A8A'
  			},
  			
  			// Professional neutrals
  			neutrals: {
  				bg: '#0F172A',
  				surface: '#1E293B',
  				elevated: '#334155',
  				muted: '#64748B',
  				text: '#F1F5F9',
  				border: '#475569'
  			},
  			
  			// shadcn/ui compatibility
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			
  			// Interactive elements
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			
  			// Professional chart colors
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))',
  				'6': 'hsl(var(--chart-6))'
  			},
  			
  			// Professional glass effects
  			'glass-bg': 'hsla(var(--glass-bg), 0.8)',
  			'glass-border': 'hsla(var(--glass-border), 0.2)',
  			'shadow-color': 'hsl(var(--shadow-color))'
  		},
  		
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			xl: 'calc(var(--radius) + 4px)',
  			'2xl': 'calc(var(--radius) + 8px)',
  			'3xl': 'calc(var(--radius) + 12px)'
  		},
  		
  		fontFamily: {
  			sans: ['Inter', 'system-ui', 'sans-serif'],
  			mono: ['JetBrains Mono', 'Consolas', 'Courier New', 'monospace']
  		},
  		
  		boxShadow: {
  			'glass': '0 8px 32px hsla(var(--shadow-color), 0.12)',
  			'elevated': '0 20px 64px hsla(var(--shadow-color), 0.16)',
  			'glow': '0 0 32px hsla(var(--primary), 0.3)',
  			'soft': '0 2px 8px hsla(var(--shadow-color), 0.08)',
  			'medium': '0 4px 16px hsla(var(--shadow-color), 0.12)',
  			'strong': '0 8px 32px hsla(var(--shadow-color), 0.16)'
  		},
  		
  		backdropBlur: {
  			'glass': '20px',
  			'strong': '32px',
  			'medium': '16px',
  			'soft': '8px'
  		},
  		
  		// MetaMask-inspired spacing and sizing
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  			'128': '32rem'
  		},
  		
  		// Professional animations
  		animation: {
  			'slide-in': 'slideIn 0.3s ease-out',
  			'slide-out': 'slideOut 0.3s ease-in',
  			'fade-in': 'fadeIn 0.2s ease-out',
  			'scale-in': 'scaleIn 0.2s ease-out',
  			'glow': 'glow 2s ease-in-out infinite alternate'
  		},
  		
  		keyframes: {
  			slideIn: {
  				'0%': { transform: 'translateX(-100%)' },
  				'100%': { transform: 'translateX(0)' }
  			},
  			slideOut: {
  				'0%': { transform: 'translateX(0)' },
  				'100%': { transform: 'translateX(-100%)' }
  			},
  			fadeIn: {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' }
  			},
  			scaleIn: {
  				'0%': { transform: 'scale(0.95)', opacity: '0' },
  				'100%': { transform: 'scale(1)', opacity: '1' }
  			},
  			glow: {
  				'0%': { boxShadow: '0 0 20px hsla(var(--primary), 0.3)' },
  				'100%': { boxShadow: '0 0 30px hsla(var(--primary), 0.5)' }
  			}
  		}
  	}
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
      require("tailwindcss-animate")
],
}
