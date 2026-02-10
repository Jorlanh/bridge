#!/bin/bash

# Script para instalar Redis no Linux

echo "🔴 Instalando Redis..."

# Verificar se já está instalado
if command -v redis-server &> /dev/null; then
    echo "✅ Redis já está instalado"
    redis-server --version
else
    # Detectar distribuição Linux
    if [ -f /etc/debian_version ]; then
        # Ubuntu/Debian
        echo "📦 Instalando Redis via apt..."
        sudo apt update
        sudo apt install -y redis-server
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        echo "📦 Instalando Redis via yum..."
        sudo yum install -y redis
    else
        echo "❌ Distribuição não suportada. Instale Redis manualmente."
        exit 1
    fi
fi

# Iniciar Redis
echo "🚀 Iniciando Redis..."
sudo systemctl start redis-server 2>/dev/null || sudo systemctl start redis 2>/dev/null

# Habilitar para iniciar automaticamente
echo "⚙️  Habilitando Redis para iniciar automaticamente..."
sudo systemctl enable redis-server 2>/dev/null || sudo systemctl enable redis 2>/dev/null

# Verificar se está rodando
if redis-cli ping &> /dev/null; then
    echo "✅ Redis está rodando!"
    redis-cli ping
else
    echo "⚠️  Redis pode não estar rodando. Tente: sudo systemctl start redis-server"
fi

echo ""
echo "📝 Próximos passos:"
echo "1. Verifique se Redis está rodando: redis-cli ping"
echo "2. Reinicie o servidor Node.js para aplicar as configurações"
echo "3. Verifique os logs do servidor para confirmar que as filas foram inicializadas"

