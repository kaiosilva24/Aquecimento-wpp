# S7 VPN Connection Test

Este diretório contém scripts para testar a conexão VPN do dispositivo S7.

## Arquivos Criados

1. **test_vpn.sh** - Script shell completo para teste no servidor
2. **backend/test_vpn_connection.js** - Versão Node.js do teste
3. **run_vpn_test.sh** - Script para fazer deploy e executar o teste

## Como Usar

### Opção 1: Executar no Servidor (Recomendado)

```bash
# No seu computador local
bash run_vpn_test.sh
```

Ou manualmente:

```bash
# Fazer upload do script
scp test_vpn.sh ubuntu@152.67.35.127:~/

# Conectar ao servidor e executar
ssh ubuntu@152.67.35.127
sudo bash ~/test_vpn.sh
```

### Opção 2: Executar Localmente (Se tiver acesso SSH)

```bash
ssh ubuntu@152.67.35.127 "sudo bash -s" < test_vpn.sh
```

## O Que o Teste Verifica

✅ **Status do Serviço OpenVPN**
- Verifica se o serviço está rodando
- Tenta iniciar se estiver parado

✅ **Clientes Conectados**
- Lista todos os dispositivos conectados ao VPN
- Identifica especificamente o dispositivo S7
- Mostra IP VPN atribuído a cada cliente

✅ **Interface de Rede VPN**
- Verifica se a interface tun0 está ativa
- Mostra o IP do servidor na rede VPN

✅ **Conectividade Internet**
- Testa conexão do servidor
- Mostra IP público do servidor
- Exibe informações de localização

✅ **Regras de Firewall**
- Verifica NAT para tráfego VPN
- Confirma porta 1194 aberta

✅ **Configurações de Cliente**
- Lista arquivos .ovpn gerados

## Interpretando os Resultados

### ✅ Conexão VPN Funcionando
Se você ver:
```
🎯 S7 DEVICE FOUND!
   VPN IP: 10.8.0.X
```

Significa que:
- S7 está conectado ao VPN
- Pode usar o IP VPN (10.8.0.X) como proxy
- Todo tráfego do S7 passa pelo servidor Oracle

### ⚠️ S7 Não Conectado
Se não aparecer o S7 na lista:
1. Verifique se o app OpenVPN Connect está instalado no S7
2. Confirme que o arquivo s7.ovpn foi importado
3. Certifique-se de que a VPN está conectada no dispositivo
4. Verifique se há internet no S7

## Testando a Conexão no Dispositivo S7

Após conectar o VPN no S7:

1. **Abra um navegador no S7**
2. **Acesse:** https://ifconfig.me
3. **Deve mostrar:** IP do servidor Oracle (não o IP da operadora móvel)

Se mostrar o IP do servidor = ✅ VPN funcionando!

## Usando o VPN IP como Proxy

Depois que o S7 estiver conectado e você tiver o VPN IP (ex: 10.8.0.5):

```javascript
// No seu código WhatsApp
const proxyConfig = {
    host: '10.8.0.5',  // VPN IP do S7
    port: 8080,         // Porta do proxy no S7
    protocol: 'http'
};
```

## Troubleshooting

### Serviço não inicia
```bash
sudo systemctl status openvpn-server@server
sudo journalctl -u openvpn-server@server -n 50
```

### Firewall bloqueando
```bash
sudo ufw status
sudo ufw allow 1194/udp
```

### Logs do OpenVPN
```bash
sudo tail -f /var/log/openvpn/openvpn.log
sudo cat /var/log/openvpn/openvpn-status.log
```
