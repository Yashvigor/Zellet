/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Plus Jakarta Sans', 'sans-serif'],
            },
            colors: {
                brand: {
                    dark: '#0f172a',
                    primary: '#2563eb',
                    primaryLight: '#eff6ff',
                    secondary: '#10b981',
                    accent: '#8b5cf6',
                    surface: '#ffffff',
                    light: '#f8fafc'
                }
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                'glow': '0 0 20px rgba(37, 99, 235, 0.15)',
                'card': '0 10px 40px -10px rgba(0,0,0,0.08)'
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'mesh': 'radial-gradient(at 40% 20%, hsla(228,100%,74%,1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,100%,93%,1) 0px, transparent 50%)',
            },
            animation: {
                'blob': 'blob 7s infinite',
                'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
                'fade-in-up-delay-1': 'fade-in-up 0.8s ease-out 0.2s forwards',
                'fade-in-up-delay-2': 'fade-in-up 0.8s ease-out 0.4s forwards',
                'fade-in-up-delay-3': 'fade-in-up 0.8s ease-out 0.6s forwards',
                'fade-in': 'fade-in 1s ease-out forwards',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                'fade-in-up': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
    },
    plugins: [],
}
