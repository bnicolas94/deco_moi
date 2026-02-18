/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#E8C4A6',
                    dark: '#D4A07A',
                    light: '#F0D5BF',
                },
                secondary: '#8B7355',
                accent: '#C9A980',
                gold: '#FFD700',
                'rose-gold': '#E0BFB8',
                silver: '#C0C0C0',
                'off-white': '#FAF8F6',
                'light-gray': '#F5F3F0',
                'dark-gray': '#4A4A4A',
                'brand-black': '#1A1A1A',
                success: '#4CAF50',
                error: '#F44336',
                warning: '#FF9800',
                info: '#2196F3',
            },
            fontFamily: {
                heading: ['Montserrat', 'sans-serif'],
                body: ['Open Sans', 'sans-serif'],
            },
            fontSize: {
                '2xs': '0.625rem',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'slide-in-left': 'slideInLeft 0.3s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
                'float': 'float 3s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
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
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(100%)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideInLeft: {
                    '0%': { opacity: '0', transform: 'translateX(-100%)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            backgroundImage: {
                'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
            },
            backgroundSize: {
                'shimmer': '200% 100%',
            },
        },
    },
    plugins: [],
};
