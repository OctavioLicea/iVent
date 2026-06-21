// Página: Vite config — app/vite.config.js
// Cambio: base cambiado de "/ivent/" a "/ivent/app/" — la app funcional ahora vive en un subpath dentro de /ivent, porque /ivent a secas será la landing de venta (HTML estático)
// 2026-06-19 19:30
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
 
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ivent/app/',
})
 