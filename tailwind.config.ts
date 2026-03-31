import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        purple: {
          50: '#F5F3FF',
          100: '#EAE8FC',
          200: '#C4BFEF',
          500: '#7B6FE0',
          600: '#5B4FCF',
          700: '#3B32A0',
          900: '#1A1535',
        },
      },
      fontFamily: {
        heebo: ['Heebo', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
