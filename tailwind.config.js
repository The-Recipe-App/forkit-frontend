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
        radialGlow: {
          "0%": {
            backgroundSize: "100% 100%",
            opacity: "0.6",
          },
          "50%": {
            backgroundSize: "140% 140%",
            opacity: "0.9",
          },
          "100%": {
            backgroundSize: "100% 100%",
            opacity: "0.6",
          },
        },
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
        "radial-glow": "radialGlow 6s ease-in-out infinite",
      },
      screens: {
        'xxl': '1650px',
      },
    },
  },
};

