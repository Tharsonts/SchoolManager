import { createRoot } from "react-dom/client";
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";
import "./lib/tunnelBypass"; // Importar bypass automático do LocalTunnel

// Verificar se o elemento root existe
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Renderizar aplicação
try {
  const root = createRoot(rootElement);
  root.render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
} catch (error) {
  console.error("Erro ao renderizar aplicação:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
      <h2>Erro ao carregar a aplicação</h2>
      <p>Por favor, recarregue a página.</p>
    </div>
  `;
}
