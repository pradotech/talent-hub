/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fia: {
          // Paleta Oficial do Manual de Branding FIA Business School
          deep: '#084734',       // Verde Profundo (Pantone 3308 C)
          lime: '#c3fa75',       // Verde Decidido (Pantone 374 C)
          blue: '#142d59',       // Azul (Pantone 534 C)
          sereno: '#e9f2dc',     // Verde Sereno (Pantone 9544 C)
          solido: '#abbd88',     // Verde Sólido (Pantone 4205 C)
          cha: '#75a365',        // Verde Chá (Pantone 4207 C)
          cinza: '#696a65',      // Cinza (Pantone 2333 C)

          // Escala Principal apontando para o Verde Profundo oficial
          navy: {
            DEFAULT: '#084734',
            50: '#eef8f3',
            100: '#e9f2dc',     // Verde Sereno
            200: '#c5e2d1',
            300: '#8ec4a7',
            400: '#4fa17a',
            500: '#237d57',
            600: '#146445',
            700: '#0f543a',
            800: '#0c4832',
            900: '#084734',     // Verde Profundo Oficial
            950: '#04271c',
          },
          accent: {
            DEFAULT: '#c3fa75', // Verde Decidido
            hover: '#b5f560',
            dark: '#084734',
          },
        },
      },
      fontFamily: {
        // Fonte oficial do manual de identidade da FIA
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.025em',
        tighter: '-0.02em',    // Tracking oficial para títulos (-20 a 0)
        tight: '-0.015em',
      },
    },
  },
  plugins: [],
}
