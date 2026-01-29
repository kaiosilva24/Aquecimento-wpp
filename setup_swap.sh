#!/bin/bash
set -e

# Desativar swap existente se houver para recriar
if [ -f /swapfile ]; then
    echo "Desativando swap existente..."
    sudo swapoff /swapfile || true
    sudo rm /swapfile || true
fi

echo "Criando swap de 4GB (Ideal para 10 conexões em 1GB RAM)..."
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Configurar fstab se não estiver lá
if ! grep -q "/swapfile none swap" /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Ajustar Swappiness e Cache Pressure para performance
# swappiness=10: Tenta manter na RAM o máximo possível, só usa disco em emergência (evita lentidão)
# vfs_cache_pressure=50: Mantém inode cache na RAM por mais tempo (bom para arquivos do node)
sudo sysctl vm.swappiness=10
sudo sysctl vm.vfs_cache_pressure=50

echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
echo "vm.vfs_cache_pressure=50" | sudo tee -a /etc/sysctl.conf

echo "✅ Swap de 4GB configurado com sucesso!"
free -h
