// Configuração do Vite (ferramenta que roda e empacota o front-end)
import { defineConfig } from "vite";
// Plugin que habilita o React (JSX, recarregamento rápido, etc.)
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // O front-end roda na porta 5173 (o backend fica na 3333)
  server: { port: 5173 },
});
