// app/docs/page.tsx
"use client";

import { useEffect, useRef } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function DocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Configurar tema escuro personalizado
    const style = document.createElement("style");
    style.innerHTML = `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { color: #00a650; }
      .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; border-radius: 5px; }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            API Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Documentação completa da API MercadoPago NextJS com exemplos
            interativos, esquemas de dados e guias de integração.
          </p>
        </div>

        <div
          ref={containerRef}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <SwaggerUI
            url="/api/docs/openapi.yaml"
            docExpansion="list"
            defaultModelsExpandDepth={2}
            defaultModelExpandDepth={2}
            displayOperationId={false}
            displayRequestDuration={true}
            filter={true}
            showExtensions={true}
            showCommonExtensions={true}
            tryItOutEnabled={true}
            requestInterceptor={(request: any) => {
              // Adicionar headers padrão para testes
              if (!request.headers["X-API-Key"]) {
                request.headers["X-API-Key"] = "your-api-key-here";
              }
              return request;
            }}
            responseInterceptor={(response: any) => {
              // Log de respostas para debug
              console.log("API Response:", response);
              return response;
            }}
          />
        </div>

        <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            💡 Dica de Uso
          </h3>
          <p className="text-blue-800">
            Use o botão "Try it out" para testar os endpoints diretamente na
            documentação. Certifique-se de configurar sua API Key no campo de
            autenticação no topo da página.
          </p>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              🚀 SDK JavaScript
            </h3>
            <p className="text-green-800 mb-3">
              Use nosso SDK oficial para integração simplificada.
            </p>
            <pre className="bg-green-100 p-3 rounded text-sm overflow-x-auto">
              <code>{`npm install @mercadopago-nextjs/sdk`}</code>
            </pre>
          </div>

          <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              📊 Rate Limits
            </h3>
            <div className="text-purple-800 text-sm space-y-1">
              <div>• Checkout: 100 req/min</div>
              <div>• Subscription: 50 req/min</div>
              <div>• Webhook: 1000 req/min</div>
              <div>• Transactions: 200 req/min</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
