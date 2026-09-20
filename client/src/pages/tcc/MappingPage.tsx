import React from "react";
import MappingPanel from "./MappingPanel";

export default function MappingPage() {
  return (
    <div className="min-h-screen w-full bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">TCC — Painel de Mapeamento OO-Relacional</h1>
          <p className="text-sm text-gray-600">Visualização integrada do diagrama ER e link para o documento.</p>
        </div>
        <MappingPanel />
      </div>
    </div>
  );
}