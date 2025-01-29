/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors:{
          primaryBg: {
            default: {
              dark: '#131314',
              light: '#ffffff'
            },
            sideBar: {
              dark: '#1e1f20',
              light: '#f1f1f1'
            }
          }
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0', transform: 'translateY(10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
        },
        animation: {
          fadeIn: 'fadeIn 0.3s ease-out forwards',
        },
      },
    },
    plugins: [],
  }