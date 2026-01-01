/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85', filter: 'brightness(1)' },
          '50%': { transform: 'scale(1.15)', opacity: '1', filter: 'brightness(1.3)' },
        },
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
      },
      screens: {
        'xxl': '1650px',
      },
    },
  },
};

