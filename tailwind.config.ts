import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				// === CORE THEME COLORS ===
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				
				// === SEMANTIC COLORS ===
				success: 'hsl(var(--success))',
				warning: 'hsl(var(--warning))',
				error: 'hsl(var(--error))',
				info: 'hsl(var(--info))',
				
				// === MODERN AGRICULTURAL BRAND COLORS ===
				'brand-primary': {
					50: 'hsl(var(--brand-primary-50))',
					100: 'hsl(var(--brand-primary-100))',
					200: 'hsl(var(--brand-primary-200))',
					300: 'hsl(var(--brand-primary-300))',
					400: 'hsl(var(--brand-primary-400))',
					500: 'hsl(var(--brand-primary-500))',
					600: 'hsl(var(--brand-primary-600))',
					700: 'hsl(var(--brand-primary-700))',
					800: 'hsl(var(--brand-primary-800))',
					900: 'hsl(var(--brand-primary-900))',
					950: 'hsl(var(--brand-primary-950))',
				},
				'brand-earth': {
					50: 'hsl(var(--brand-earth-50))',
					100: 'hsl(var(--brand-earth-100))',
					200: 'hsl(var(--brand-earth-200))',
					300: 'hsl(var(--brand-earth-300))',
					400: 'hsl(var(--brand-earth-400))',
					500: 'hsl(var(--brand-earth-500))',
					600: 'hsl(var(--brand-earth-600))',
					700: 'hsl(var(--brand-earth-700))',
					800: 'hsl(var(--brand-earth-800))',
					900: 'hsl(var(--brand-earth-900))',
				},
				'brand-grain': {
					50: 'hsl(var(--brand-grain-50))',
					100: 'hsl(var(--brand-grain-100))',
					200: 'hsl(var(--brand-grain-200))',
					300: 'hsl(var(--brand-grain-300))',
					400: 'hsl(var(--brand-grain-400))',
					500: 'hsl(var(--brand-grain-500))',
					600: 'hsl(var(--brand-grain-600))',
					700: 'hsl(var(--brand-grain-700))',
					800: 'hsl(var(--brand-grain-800))',
					900: 'hsl(var(--brand-grain-900))',
				},
				'brand-sky': {
					50: 'hsl(var(--brand-sky-50))',
					100: 'hsl(var(--brand-sky-100))',
					400: 'hsl(var(--brand-sky-400))',
					500: 'hsl(var(--brand-sky-500))',
					600: 'hsl(var(--brand-sky-600))',
				},
				
				// === MODERN AGRICULTURAL SEMANTIC COLORS ===
				growth: 'hsl(var(--growth))',
				harvest: 'hsl(var(--harvest))',
				soil: 'hsl(var(--soil))',
				weather: 'hsl(var(--weather))',
				
				// === MODERN SIDEBAR SYSTEM ===
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			
			// === MODERN TYPOGRAPHY ===
			fontFamily: {
				sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				serif: ['ui-serif', 'Georgia', 'serif'],
				mono: ['ui-monospace', 'SF Mono', 'monospace'],
			},
			fontSize: {
				'xs': ['var(--font-size-xs)', { lineHeight: 'var(--line-height-tight)', letterSpacing: 'var(--letter-spacing-tight)' }],
				'sm': ['var(--font-size-sm)', { lineHeight: 'var(--line-height-tight)', letterSpacing: 'var(--letter-spacing-tight)' }],
				'base': ['var(--font-size-base)', { lineHeight: 'var(--line-height-normal)', letterSpacing: 'var(--letter-spacing-normal)' }],
				'lg': ['var(--font-size-lg)', { lineHeight: 'var(--line-height-normal)', letterSpacing: 'var(--letter-spacing-tight)' }],
				'xl': ['var(--font-size-xl)', { lineHeight: 'var(--line-height-tight)', letterSpacing: 'var(--letter-spacing-tight)' }],
				'2xl': ['var(--font-size-2xl)', { lineHeight: 'var(--line-height-tight)', letterSpacing: 'var(--letter-spacing-tight)' }],
				'3xl': ['var(--font-size-3xl)', { lineHeight: 'var(--line-height-tight)', letterSpacing: 'var(--letter-spacing-tight)' }],
				'4xl': ['var(--font-size-4xl)', { lineHeight: 'var(--line-height-tight)', letterSpacing: 'var(--letter-spacing-tight)' }],
				'5xl': ['var(--font-size-5xl)', { lineHeight: '1', letterSpacing: 'var(--letter-spacing-tight)' }],
				'6xl': ['var(--font-size-6xl)', { lineHeight: '1', letterSpacing: 'var(--letter-spacing-tight)' }],
				'7xl': ['4.5rem', { lineHeight: '1', letterSpacing: 'var(--letter-spacing-tight)' }],
				'8xl': ['6rem', { lineHeight: '1', letterSpacing: 'var(--letter-spacing-tight)' }],
				'9xl': ['8rem', { lineHeight: '1', letterSpacing: 'var(--letter-spacing-tight)' }],
			},
			
			// === MODERN SPACING SYSTEM ===
			spacing: {
				'xs': 'var(--spacing-xs)',
				'sm': 'var(--spacing-sm)',
				'md': 'var(--spacing-md)',
				'lg': 'var(--spacing-lg)',
				'xl': 'var(--spacing-xl)',
				'2xl': 'var(--spacing-2xl)',
				'3xl': 'var(--spacing-3xl)',
				'18': '4.5rem',
				'88': '22rem',
				'128': '32rem',
			},
			
			// === MODERN BORDER RADIUS ===
			borderRadius: {
				'sm': 'var(--radius-sm)',
				'md': 'var(--radius-md)',
				'lg': 'var(--radius-lg)',
				'xl': 'var(--radius-xl)',
				'2xl': 'var(--radius-2xl)',
				DEFAULT: 'var(--radius)',
			},
			
			// === MODERN BOX SHADOW ===
			boxShadow: {
				'sm': 'var(--shadow-sm)',
				'md': 'var(--shadow-md)',
				'lg': 'var(--shadow-lg)',
				'xl': 'var(--shadow-xl)',
				'2xl': 'var(--shadow-2xl)',
				'agricultural': 'var(--shadow-agricultural)',
				'earth': 'var(--shadow-earth)',
				'harvest': 'var(--shadow-harvest)',
				'weather': 'var(--shadow-weather)',
			},
			
			// === MODERN ANIMATIONS ===
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					from: { opacity: '0', transform: 'translateY(10px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-up': {
					from: { opacity: '0', transform: 'translateY(20px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-down': {
					from: { opacity: '0', transform: 'translateY(-20px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					from: { opacity: '0', transform: 'scale(0.9)' },
					to: { opacity: '1', transform: 'scale(1)' }
				},
				'agricultural-pulse': {
					'0%, 100%': { transform: 'scale(1)', opacity: '1' },
					'50%': { transform: 'scale(1.05)', opacity: '0.8' }
				},
				'button-press': {
					'0%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(0.98)' },
					'100%': { transform: 'scale(1)' }
				},
				'card-hover': {
					'0%': { transform: 'translateY(0)', boxShadow: 'var(--shadow-md)' },
					'100%': { transform: 'translateY(-2px)', boxShadow: 'var(--shadow-lg)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in var(--transition-normal) ease-out',
				'slide-up': 'slide-up var(--transition-normal) ease-out',
				'slide-down': 'slide-down var(--transition-normal) ease-out',
				'scale-in': 'scale-in var(--transition-normal) ease-out',
				'agricultural-pulse': 'agricultural-pulse 2s ease-in-out infinite',
				'button-press': 'button-press var(--transition-fast) ease-out',
				'card-hover': 'card-hover var(--transition-normal) ease-out',
			},
			
			// === MODERN TIMING FUNCTIONS ===
			transitionTimingFunction: {
				'agricultural': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				'fast': 'var(--transition-fast)',
				'normal': 'var(--transition-normal)',
				'slow': 'var(--transition-slow)',
			},
			
			// === MODERN BREAKPOINTS ===
			screens: {
				'xs': '475px',
				'sm': '640px',
				'md': '768px',
				'lg': '1024px',
				'xl': '1280px',
				'2xl': '1536px',
			},
			
			// === MODERN TRANSITIONS ===
			transitionDuration: {
				'fast': '150ms',
				'normal': '250ms',
				'slow': '350ms',
			},
			
			// === MODERN Z-INDEX ===
			zIndex: {
				'header': '100',
				'sidebar': '200',
				'modal': '300',
				'tooltip': '400',
				'toast': '500',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
