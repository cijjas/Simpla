import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        serif: ['var(--font-lora)', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.1em', // -5% kerning
      },
    },
  },
  plugins: [],
};

export default config;
