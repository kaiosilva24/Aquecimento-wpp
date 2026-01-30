#!/bin/bash
set -e

APP_DIR="whatsapp-warming"

# Limpar instalação anterior se existir
rm -rf $APP_DIR
mkdir $APP_DIR

# Extrair
echo "A extrair arquivos..."
tar -xzf deployment.tar.gz -C $APP_DIR

cd $APP_DIR

# Instalar dependências de produção
echo "A instalar dependências..."
npm install --omit=dev

# Configurar PM2
echo "A iniciar aplicação..."
pm2 delete whatsapp-warming || true
NODE_ENV=production pm2 start backend/server.js --name "whatsapp-warming"

echo "A salvar Lista de Processos..."
pm2 save
pm2 startup | tail -n 1 > startup_cmd.sh && chmod +x startup_cmd.sh && ./startup_cmd.sh || true

echo "✅ Deploy Concluído!"
pm2 status
