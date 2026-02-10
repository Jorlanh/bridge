#!/bin/bash

# Script para verificar a configuração do sistema

echo "🔍 Verificando configuração do BridgeAI Hub..."
echo ""

# Verificar Redis
echo "📦 Redis:"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "  ✅ Redis está instalado e rodando"
        redis-cli info server | grep "redis_version" | head -1
    else
        echo "  ⚠️  Redis está instalado mas não está rodando"
        echo "     Execute: sudo systemctl start redis-server"
    fi
else
    echo "  ❌ Redis não está instalado"
    echo "     Execute: ./install-redis.sh ou instale manualmente"
fi
echo ""

# Verificar variáveis de ambiente
echo "📝 Variáveis de ambiente:"
if [ -f .env ]; then
    if grep -q "REDIS_HOST" .env; then
        echo "  ✅ REDIS_HOST configurado"
    else
        echo "  ⚠️  REDIS_HOST não encontrado no .env"
    fi
    
    if grep -q "BACKUP_DIR" .env; then
        echo "  ✅ BACKUP_DIR configurado"
    else
        echo "  ⚠️  BACKUP_DIR não encontrado no .env"
    fi
else
    echo "  ❌ Arquivo .env não encontrado"
fi
echo ""

# Verificar diretório de backups
echo "📁 Diretório de backups:"
if [ -d "./backups" ]; then
    echo "  ✅ Diretório ./backups existe"
    ls -lh ./backups | head -5
else
    echo "  ⚠️  Diretório ./backups não existe (será criado automaticamente)"
fi
echo ""

# Verificar MongoDB
echo "🗄️  MongoDB:"
if command -v mongodump &> /dev/null; then
    echo "  ✅ mongodump está instalado (backup automático disponível)"
else
    echo "  ⚠️  mongodump não está instalado (backup automático não funcionará)"
    echo "     Instale MongoDB Tools para habilitar backups"
fi
echo ""

# Verificar Node.js
echo "🟢 Node.js:"
if command -v node &> /dev/null; then
    echo "  ✅ Node.js $(node --version) instalado"
else
    echo "  ❌ Node.js não encontrado"
fi
echo ""

echo "✅ Verificação concluída!"

