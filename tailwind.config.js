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
        }
      },
    },
    plugins: [],
  }