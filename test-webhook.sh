#!/bin/bash

# Script de Teste para Webhook do Mercado Pago
# Execute este script para testar o webhook localmente

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testando Webhook do Mercado Pago${NC}"
echo "=================================================="

# URL base (ajuste se necessário)
BASE_URL="http://localhost:3000"

# Função para testar webhook
test_webhook() {
    local event_type=$1
    local data_id=$2
    local description=$3
    
    echo -e "\n${BLUE}Testando: $description${NC}"
    echo "Event Type: $event_type | Data ID: $data_id"
    
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -X POST "$BASE_URL/api/mercado-pago/webhook?data.id=$data_id" \
        -H "Content-Type: application/json" \
        -H "x-signature: ts=$(date +%s),v1=test_hash_123" \
        -H "x-request-id: req-test-$(date +%s)" \
        -d "{
            \"type\": \"$event_type\",
            \"data\": {
                \"id\": \"$data_id\"
            }
        }")
    
    http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    response_body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [ "$http_status" = "200" ]; then
        echo -e "${GREEN}✅ Sucesso (HTTP $http_status)${NC}"
        echo "Response: $response_body"
    else
        echo -e "${RED}❌ Erro (HTTP $http_status)${NC}"
        echo "Response: $response_body"
    fi
}

# Função para verificar se o servidor está rodando
check_server() {
    echo -e "${BLUE}🔍 Verificando se o servidor está rodando...${NC}"
    
    if curl -s "$BASE_URL" > /dev/null; then
        echo -e "${GREEN}✅ Servidor está rodando em $BASE_URL${NC}"
        return 0
    else
        echo -e "${RED}❌ Servidor não está rodando em $BASE_URL${NC}"
        echo "Execute 'npm run dev' em outro terminal primeiro!"
        return 1
    fi
}

# Verificar servidor
if ! check_server; then
    exit 1
fi

# Testes dos webhooks
echo -e "\n${BLUE}🚀 Iniciando testes de webhook...${NC}"

# Teste 1: Pagamento aprovado (simulando Mastercard)
test_webhook "payment" "pay_mastercard_123" "Pagamento Mastercard Aprovado"

# Teste 2: Pagamento Pix aprovado
test_webhook "payment" "pay_pix_456" "Pagamento PIX Aprovado"

# Teste 3: Assinatura autorizada
test_webhook "subscription_preapproval" "sub_monthly_789" "Assinatura Mensal Autorizada"

# Teste 4: Pagamento de assinatura
test_webhook "subscription_authorized_payment" "sub_payment_012" "Pagamento de Assinatura"

# Teste 5: Evento desconhecido (deve ser ignorado)
test_webhook "unknown_event" "unknown_345" "Evento Desconhecido (deve ignorar)"

echo -e "\n${BLUE}📊 Resumo dos Testes${NC}"
echo "=================================================="
echo "• Pagamento Mastercard: Deve processar e chamar handler"
echo "• Pagamento PIX: Deve processar e chamar handler" 
echo "• Assinatura: Deve processar eventos de subscription"
echo "• Evento Desconhecido: Deve retornar 200 mas ignorar"
echo "• Todos devem verificar assinatura e retornar HTTP 200"

echo -e "\n${GREEN}✅ Testes de webhook concluídos!${NC}"
echo -e "${BLUE}💡 Dica: Verifique os logs do servidor para mais detalhes${NC}"

# Informações adicionais
echo -e "\n${BLUE}📋 Dados de Teste Disponíveis:${NC}"
echo "• Usuário: Dionatan Brasil (ID: 2973455888)"
echo "• Email: dionatan.brasil@test.com"
echo "• Cartão Mastercard: 5031 4332 1540 6351"
echo "• Cartão Visa: 4235 6477 2802 5682"
echo "• CVV: 123 | Validade: 11/30"
echo ""
echo "📖 Para mais informações, consulte:"
echo "• DADOS_TESTE_MERCADOPAGO.md"
echo "• GUIA_TESTES_MANUAIS.md"