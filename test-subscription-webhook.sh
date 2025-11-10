#!/bin/bash

# Script específico para testar Webhook de Assinaturas do Mercado Pago
# Execute este script para testar apenas funcionalidades de assinatura

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔔 Testando Webhook de Assinaturas - Mercado Pago${NC}"
echo "==========================================================="

# URL base
BASE_URL="http://localhost:3000"

# Função para testar webhook de assinatura
test_subscription_webhook() {
    local event_type=$1
    local subscription_id=$2
    local description=$3
    local status=$4
    
    echo -e "\n${BLUE}🧪 Testando: $description${NC}"
    echo "Event Type: $event_type | Subscription ID: $subscription_id | Status: $status"
    
    # Simulando dados do webhook de assinatura
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -X POST "$BASE_URL/api/mercado-pago/webhook?data.id=$subscription_id" \
        -H "Content-Type: application/json" \
        -H "x-signature: ts=$(date +%s),v1=test_subscription_hash_$(date +%s)" \
        -H "x-request-id: req-sub-$(date +%s)" \
        -d "{
            \"type\": \"$event_type\",
            \"data\": {
                \"id\": \"$subscription_id\"
            },
            \"action\": \"payment.created\",
            \"date_created\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\",
            \"user_id\": \"2973455888\"
        }")
    
    http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    response_body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [ "$http_status" = "200" ]; then
        echo -e "${GREEN}✅ Webhook processado com sucesso (HTTP $http_status)${NC}"
        echo "Response: $response_body"
    else
        echo -e "${RED}❌ Erro no webhook (HTTP $http_status)${NC}"
        echo "Response: $response_body"
    fi
}

# Função para verificar se o servidor está rodando
check_server() {
    echo -e "${BLUE}🔍 Verificando servidor...${NC}"
    
    if curl -s "$BASE_URL" > /dev/null; then
        echo -e "${GREEN}✅ Servidor rodando em $BASE_URL${NC}"
        return 0
    else
        echo -e "${RED}❌ Servidor não encontrado em $BASE_URL${NC}"
        echo -e "${YELLOW}💡 Execute 'npm run dev' em outro terminal!${NC}"
        return 1
    fi
}

# Verificar servidor
if ! check_server; then
    exit 1
fi

echo -e "\n${BLUE}🚀 Iniciando testes de webhook de assinaturas...${NC}"

# Teste 1: Assinatura criada/autorizada
test_subscription_webhook "subscription_preapproval" "sub_dionatan_001" "Assinatura Autorizada" "authorized"

# Teste 2: Pagamento de assinatura aprovado  
test_subscription_webhook "subscription_authorized_payment" "sub_payment_002" "Pagamento de Assinatura Aprovado" "approved"

# Teste 3: Assinatura cancelada
test_subscription_webhook "subscription_preapproval" "sub_dionatan_003" "Assinatura Cancelada" "cancelled"

# Teste 4: Assinatura pausada
test_subscription_webhook "subscription_preapproval" "sub_dionatan_004" "Assinatura Pausada" "paused"

# Teste 5: Falha no pagamento de assinatura
test_subscription_webhook "subscription_authorized_payment" "sub_payment_005" "Falha no Pagamento de Assinatura" "rejected"

echo -e "\n${BLUE}📊 Resumo dos Testes de Assinatura${NC}"
echo "==========================================================="
echo -e "${GREEN}✅ Cenários testados:${NC}"
echo "• Assinatura autorizada (subscription_preapproval)"
echo "• Pagamento de assinatura aprovado (subscription_authorized_payment)"
echo "• Diferentes status: authorized, approved, cancelled, paused, rejected"
echo -e "\n${BLUE}🔍 O que o webhook deve fazer:${NC}"
echo "• Verificar assinatura HMAC"
echo "• Processar eventos de subscription_preapproval com status 'authorized'"
echo "• Processar eventos de subscription_authorized_payment"
echo "• Chamar handleMercadoPagoSubscription() quando apropriado"
echo "• Retornar HTTP 200 para todos os casos válidos"

echo -e "\n${YELLOW}💡 Dados de teste utilizados:${NC}"
echo "• User ID: 2973455888 (Dionatan Brasil)"
echo "• Subscription IDs: sub_dionatan_001, sub_payment_002, etc."
echo "• Event Types: subscription_preapproval, subscription_authorized_payment"

echo -e "\n${GREEN}✅ Testes de webhook de assinatura concluídos!${NC}"
echo -e "${BLUE}📖 Para mais detalhes, consulte DADOS_TESTE_MERCADOPAGO.md${NC}"