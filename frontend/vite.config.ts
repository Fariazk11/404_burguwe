// Configuração do Vite (ferramenta que roda e empacota o front-end)
import { defineConfig } from "vite";
// Plugin que habilita o React (JSX, recarregamento rápido, etc.)
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // O site é publicado no GitHub Pages em https://fariazk11.github.io/404_burguwe/
  // (todos os arquivos ficam dentro dessa subpasta; localmente: http://localhost:5173/404_burguwe/)
  base: "/404_burguwe/",
  // O front-end roda na porta 5173 (o backend fica na 3333)
  server: { port: 5173 },
});
