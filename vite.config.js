// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',           // para rutas relativas en GitHub Pages
  build: {
    outDir: 'docs',     // Vite pondrá el build en /docs
    emptyOutDir: true   // limpia docs/ antes de cada build
  }
});
