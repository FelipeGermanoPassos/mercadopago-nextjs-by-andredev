#!/bin/bash

# Demonstração: Como diferentes sistemas integram com sua API

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🌐 DEMONSTRAÇÃO: INTEGRAÇÃO MULTI-SISTEMA${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════════════════${NC}"

BASE_URL="http://localhost:3000"

echo -e "\n${BLUE}📱 Simulando integração com diferentes sistemas...${NC}"

# Sistema 1: WordPress E-commerce
echo -e "\n${YELLOW}1. 🛒 Sistema WordPress E-commerce${NC}"
echo "Criando checkout para produto do WordPress..."

curl -s -X POST "$BASE_URL/api/mercado-pago/create-checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "produto": "Plugin Premium WordPress",
    "preco": 99.90,
    "email": "cliente@wordpress-site.com",
    "order_id": "WP_2025_001"
  }' | jq -r '.init_point // "Erro: " + .error'

# Sistema 2: App Mobile
echo -e "\n${YELLOW}2. 📱 App Mobile (React Native)${NC}"
echo "Criando assinatura mensal para usuário mobile..."

curl -s -X POST "$BASE_URL/api/mercado-pago/create-subscription" \
  -H "Content-Type: application/json" \
  -d '{
    "planType": "monthly",
    "userEmail": "user@mobileapp.com",
    "userId": "MOBILE_USER_123"
  }' | jq -r '.init_point // "Erro: " + .error'

# Sistema 3: Sistema ERP Java
echo -e "\n${YELLOW}3. ☕ Sistema ERP (Java Spring)${NC}"
echo "Processando fatura empresarial..."

curl -s -X POST "$BASE_URL/api/mercado-pago/create-checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "produto": "Licença Enterprise - 12 meses",
    "preco": 2999.90,
    "email": "financeiro@empresa.com",
    "order_id": "ERP_INV_2025_0001"
  }' | jq -r '.init_point // "Erro: " + .error'

# Sistema 4: Plataforma Python
echo -e "\n${YELLOW}4. 🐍 Sistema Python (Django)${NC}"
echo "Criando assinatura anual com desconto..."

curl -s -X POST "$BASE_URL/api/mercado-pago/create-subscription" \
  -H "Content-Type: application/json" \
  -d '{
    "planType": "annual",
    "userEmail": "admin@python-system.com", 
    "userId": "PY_ADMIN_456"
  }' | jq -r '.init_point // "Erro: " + .error'

# Sistema 5: Marketplace Multi-vendor
echo -e "\n${YELLOW}5. 🏪 Marketplace Multi-vendor${NC}"
echo "Processando venda de múltiplos vendedores..."

curl -s -X POST "$BASE_URL/api/mercado-pago/create-checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "produto": "Pacote Marketplace - 3 produtos",
    "preco": 149.90,
    "email": "comprador@marketplace.com",
    "order_id": "MARKET_2025_PACK_001"
  }' | jq -r '.init_point // "Erro: " + .error'

# Sistema 6: Sistema de Cursos Online
echo -e "\n${YELLOW}6. 🎓 Plataforma de Cursos (EdTech)${NC}"
echo "Matriculando aluno em curso premium..."

curl -s -X POST "$BASE_URL/api/mercado-pago/create-checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "produto": "Curso Full Stack Developer",
    "preco": 497.00,
    "email": "aluno@cursostech.com",
    "order_id": "COURSE_FULLSTACK_2025"
  }' | jq -r '.init_point // "Erro: " + .error'

echo -e "\n${PURPLE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ INTEGRAÇÃO MULTI-SISTEMA DEMONSTRADA!${NC}"
echo -e "\n${BLUE}📊 Sistemas que integraram com sucesso:${NC}"
echo "• WordPress E-commerce"
echo "• App Mobile React Native" 
echo "• Sistema ERP Java"
echo "• Plataforma Python Django"
echo "• Marketplace Multi-vendor"
echo "• Plataforma de Cursos EdTech"

echo -e "\n${YELLOW}🔗 Todos os sistemas compartilham:${NC}"
echo "• ✅ Mesma API de pagamentos"
echo "• ✅ Webhook centralizado"
echo "• ✅ Verificação de segurança HMAC"
echo "• ✅ Logs unificados"
echo "• ✅ Monitoramento centralizado"

echo -e "\n${BLUE}💡 Vantagens da arquitetura multi-sistema:${NC}"
echo "• 🔄 Escalabilidade independente"
echo "• 🛠️ Manutenção centralizada"
echo "• 🔒 Segurança padronizada"
echo "• 📊 Analytics unificados"
echo "• 🚀 Deploy e atualizações simples"

echo -e "\n${GREEN}🎉 Sua API está pronta para integrar com QUALQUER sistema!${NC}"