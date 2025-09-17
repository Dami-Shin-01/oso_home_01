import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  // @ts-ignore
  daisyui: {
    themes: ['light', 'dark', 'emerald', 'forest', 'garden'],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
  },
}

export default config