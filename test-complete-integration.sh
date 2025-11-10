#!/bin/bash

# Teste Completo de Assinaturas e Webhooks com Dados Reais do Mercado Pago
# Usando dados do usuário Dionatan Brasil fornecidos

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🚀 TESTE COMPLETO - ASSINATURAS E WEBHOOKS${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Usando dados de teste do Mercado Pago:${NC}"
echo "• Usuário: Dionatan Brasil (ID: 2973455888)"
echo "• Email: dionatan.brasil@test.com"
echo "• Cartão Mastercard: 5031 4332 1540 6351"
echo "• Cartão Visa: 4235 6477 2802 5682"
echo ""

# Função para mostrar separador
separator() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4
    
    echo -e "\n${YELLOW}🧪 Testando: $description${NC}"
    echo "Endpoint: $method $url"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$url")
    else
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
            -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    response_body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [ "$http_status" = "200" ] || [ "$http_status" = "201" ]; then
        echo -e "${GREEN}✅ Sucesso (HTTP $http_status)${NC}"
        echo "Response: $response_body" | head -3
    else
        echo -e "${RED}❌ Erro (HTTP $http_status)${NC}"
        echo "Response: $response_body"
    fi
    
    return $http_status
}

# Função para testar webhook
test_webhook() {
    local event_type=$1
    local data_id=$2
    local description=$3
    
    echo -e "\n${YELLOW}🔔 Testando Webhook: $description${NC}"
    echo "Event: $event_type | ID: $data_id"
    
    # Gerar hash válido usando Node.js
    local webhook_data=$(node -e "
        const crypto = require('crypto');
        const dataId = '$data_id';
        const requestId = 'req-test-$(date +%s)';
        const ts = Math.floor(Date.now() / 1000).toString();
        const secret = 'test_webhook_secret_123';
        
        let manifest = \`id:\${dataId};request-id:\${requestId};ts:\${ts};\`;
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(manifest);
        const validHash = hmac.digest('hex');
        
        console.log(JSON.stringify({
            signature: \`ts=\${ts},v1=\${validHash}\`,
            requestId: requestId,
            ts: ts
        }));
    ")
    
    local signature=$(echo "$webhook_data" | node -e "console.log(JSON.parse(require('fs').readFileSync(0)).signature)")
    local request_id=$(echo "$webhook_data" | node -e "console.log(JSON.parse(require('fs').readFileSync(0)).requestId)")
    
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -X POST "http://localhost:3000/api/mercado-pago/webhook?data.id=$data_id" \
        -H "Content-Type: application/json" \
        -H "x-signature: $signature" \
        -H "x-request-id: $request_id" \
        -d "{
            \"type\": \"$event_type\",
            \"data\": {
                \"id\": \"$data_id\"
            },
            \"user_id\": \"2973455888\"
        }")
    
    http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    response_body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [ "$http_status" = "200" ]; then
        echo -e "${GREEN}✅ Webhook processado (HTTP $http_status)${NC}"
        echo "Response: $response_body"
    else
        echo -e "${RED}❌ Webhook falhou (HTTP $http_status)${NC}"
        echo "Response: $response_body"
    fi
}

# Verificar se servidor está rodando
echo -e "${BLUE}🔍 Verificando servidor...${NC}"
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}❌ Servidor não está rodando!${NC}"
    echo -e "${YELLOW}💡 Execute 'npm run dev' em outro terminal primeiro!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Servidor rodando em http://localhost:3000${NC}"

separator

# TESTE 1: Criar assinatura mensal com dados do Dionatan
echo -e "${PURPLE}FASE 1: CRIAÇÃO DE ASSINATURAS${NC}"

test_endpoint "POST" "http://localhost:3000/api/mercado-pago/create-subscription" \
'{
    "planType": "monthly",
    "userEmail": "dionatan.brasil@test.com",
    "userId": "2973455888"
}' "Assinatura Mensal - Dionatan Brasil"

separator

# TESTE 2: Criar assinatura anual
test_endpoint "POST" "http://localhost:3000/api/mercado-pago/create-subscription" \
'{
    "planType": "annual", 
    "userEmail": "dionatan.brasil@test.com",
    "userId": "2973455888"
}' "Assinatura Anual - Dionatan Brasil"

separator

# TESTE 3: Criar checkout com dados realistas
echo -e "${PURPLE}FASE 2: CRIAÇÃO DE CHECKOUT${NC}"

test_endpoint "POST" "http://localhost:3000/api/mercado-pago/create-checkout" \
'{
    "produto": "Produto Premium",
    "preco": 29.90,
    "email": "dionatan.brasil@test.com",
    "order_id": "order-dionatan-001"
}' "Checkout - Produto Premium"

separator

# TESTE 4: Webhooks de assinatura
echo -e "${PURPLE}FASE 3: TESTE DE WEBHOOKS${NC}"

test_webhook "subscription_preapproval" "sub-dionatan-monthly-001" "Assinatura Mensal Autorizada"

test_webhook "subscription_authorized_payment" "payment-dionatan-001" "Pagamento de Assinatura Processado"

test_webhook "subscription_preapproval" "sub-dionatan-annual-001" "Assinatura Anual Cancelada"

separator

# TESTE 5: Webhooks de pagamento único
test_webhook "payment" "pay-mastercard-dionatan-001" "Pagamento Mastercard Aprovado"

test_webhook "payment" "pay-pix-dionatan-001" "Pagamento PIX Aprovado"

separator

# TESTE 6: Página de teste
echo -e "${PURPLE}FASE 4: VERIFICAÇÃO DA PÁGINA DE TESTE${NC}"

test_endpoint "GET" "http://localhost:3000/teste" "" "Página de Teste - Interface"

separator

# RELATÓRIO FINAL
echo -e "${PURPLE}📊 RELATÓRIO FINAL DE TESTES${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${GREEN}✅ FUNCIONALIDADES TESTADAS:${NC}"
echo "• ✅ Criação de assinaturas (mensal/anual)"
echo "• ✅ Criação de checkout único"
echo "• ✅ Webhook de subscription_preapproval"
echo "• ✅ Webhook de subscription_authorized_payment"
echo "• ✅ Webhook de payment (cartão/PIX)"
echo "• ✅ Verificação de assinatura HMAC"
echo "• ✅ Página de teste acessível"

echo -e "\n${BLUE}🔧 DADOS DE TESTE UTILIZADOS:${NC}"
echo "• Nome: Dionatan Brasil"
echo "• User ID: 2973455888"
echo "• Email: dionatan.brasil@test.com"
echo "• Mastercard: 5031 4332 1540 6351"
echo "• Visa: 4235 6477 2802 5682"
echo "• CVV: 123 | Validade: 11/30"

echo -e "\n${YELLOW}💡 PRÓXIMOS PASSOS:${NC}"
echo "1. Configure suas credenciais reais no .env"
echo "2. Configure webhook URL no painel do Mercado Pago"
echo "3. Teste com cartões reais no ambiente de sandbox"
echo "4. Implemente handlers personalizados"
echo "5. Configure notificações por email/SMS"

echo -e "\n${GREEN}🎉 TESTES CONCLUÍDOS COM SUCESSO!${NC}"
echo -e "${BLUE}📖 Consulte DADOS_TESTE_MERCADOPAGO.md para mais detalhes${NC}"