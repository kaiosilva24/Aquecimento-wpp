# 📱 WhatsApp Warming System

Sistema completo de aquecimento de contas WhatsApp com interação automática entre contas, respostas automáticas, mensagens aleatórias e suporte a mídia.

## 🚀 Recursos

- ✅ **Gerenciamento de Múltiplas Contas**: Conecte e gerencie várias contas WhatsApp
- ✅ **Auto-Resposta Inteligente**: Responda automaticamente mensagens individuais e grupos
- ✅ **Pool de Mensagens**: Configure mensagens aleatórias com variáveis dinâmicas
- ✅ **Suporte a Mídia**: Envie imagens e figurinhas automaticamente
- ✅ **Delays Configuráveis**: 4 tipos de delay (Fixo, Aleatório, Humano, Progressivo)
- ✅ **Interação entre Contas**: Contas conversam entre si para aquecimento natural
- ✅ **Dashboard em Tempo Real**: Monitore estatísticas e status das contas
- ✅ **Interface Moderna**: UI premium com tema escuro e animações suaves

## 📋 Pré-requisitos

- Node.js 16+ instalado
- NPM ou Yarn
- Conta(s) WhatsApp para aquecimento

## 🛠️ Instalação

### 1. Instalar Dependências do Backend

```bash
cd C:\Users\kaiob\.gemini\antigravity\scratch\whatsapp-warming
npm install
```

### 2. Instalar Dependências do Frontend

```bash
cd frontend
npm install
```

## 🚀 Como Usar

### Iniciar o Sistema

**Terminal 1 - Backend:**
```bash
cd C:\Users\kaiob\.gemini\antigravity\scratch\whatsapp-warming
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd C:\Users\kaiob\.gemini\antigravity\scratch\whatsapp-warming\frontend
npm run dev
```

### Acessar a Interface

Abra seu navegador em: **http://localhost:5173**

## 📖 Guia de Uso

### 1. Adicionar Contas

1. Vá para a página **Contas**
2. Clique em **Adicionar Conta**
3. Digite um nome para a conta
4. Escaneie o QR code com o WhatsApp
5. Aguarde a conexão

> ⚠️ **Importante**: Você precisa de pelo menos 2 contas conectadas para iniciar o aquecimento.

### 2. Configurar Mensagens

1. Vá para a página **Mensagens**
2. Adicione mensagens que serão enviadas aleatoriamente
3. Use variáveis dinâmicas:
   - `{nome}` - Nome do contato
   - `{hora}` - Hora atual
   - `{data}` - Data atual
   - `{dia}` - Dia da semana

**Exemplo:**
```
Olá! Como você está neste {dia}?
Boa tarde! São {hora} e estava pensando em você.
```

### 3. Adicionar Mídia (Opcional)

1. Vá para a página **Mídia**
2. Faça upload de imagens ou figurinhas
3. O sistema enviará mídia aleatoriamente (30% de chance)

### 4. Configurar Delays

1. Vá para **Configurações**
2. Escolha o tipo de delay:
   - **Fixo**: Tempo exato entre mensagens
   - **Aleatório**: Range entre min-max segundos
   - **Humano**: Simula comportamento natural com pausas ocasionais
   - **Progressivo**: Aumenta gradualmente ao longo do tempo

### 5. Configurar Auto-Resposta

1. Em **Configurações**, configure:
   - Ativar/desativar para contatos individuais
   - Ativar/desativar para grupos
   - Delay antes de responder (simula digitação)
   - Lista de números para ignorar

### 6. Iniciar Aquecimento

1. Vá para o **Dashboard**
2. Clique em **Iniciar Aquecimento**
3. O sistema começará a enviar mensagens automaticamente entre as contas
4. Monitore as estatísticas em tempo real

## 🎯 Como Funciona

### Aquecimento Automático

O sistema seleciona aleatoriamente:
- Uma conta remetente
- Uma conta destinatária (diferente da remetente)
- Uma mensagem do pool
- Opcionalmente, uma mídia (30% de chance)

Depois envia a mensagem e aguarda o delay configurado antes da próxima interação.

### Auto-Resposta

Quando uma conta recebe uma mensagem:
1. Verifica se auto-resposta está ativa
2. Aguarda o delay configurado (simula digitação)
3. Seleciona uma mensagem aleatória
4. Envia a resposta (70% texto, 30% com mídia)
5. Registra na história para evitar loops

## 📊 Estatísticas

O Dashboard mostra:
- Contas conectadas
- Mensagens enviadas hoje
- Total de interações
- Status do sistema (Ativo/Pausado)
- Distribuição de mensagens (Texto/Imagens/Figurinhas)
- Interações recentes

## ⚠️ Avisos Importantes

### Limites do WhatsApp

O WhatsApp possui limites de envio para prevenir spam:
- Não envie muitas mensagens em curto período
- Use delays adequados (recomendado: 60-120 segundos)
- Evite comportamento robótico

### Risco de Banimento

- Use o sistema de forma responsável
- Não envie spam
- Respeite os Termos de Serviço do WhatsApp
- O uso excessivo pode resultar em banimento temporário ou permanente

### Boas Práticas

✅ **Recomendado:**
- Delays de 60-120 segundos entre mensagens
- Máximo 50-100 mensagens por dia por conta
- Mensagens naturais e variadas
- Horário comercial (8h-22h)

❌ **Evite:**
- Delays muito curtos (< 30 segundos)
- Mensagens repetitivas
- Envio 24/7 sem parar
- Comportamento claramente automatizado

## 🔧 Estrutura do Projeto

```
whatsapp-warming/
├── backend/
│   ├── database/
│   │   └── database.js          # SQLite database
│   ├── routes/
│   │   ├── accountRoutes.js     # Gerenciamento de contas
│   │   ├── messageRoutes.js     # CRUD de mensagens
│   │   ├── mediaRoutes.js       # Upload de mídia
│   │   ├── configRoutes.js      # Configurações
│   │   └── interactionRoutes.js # Controle de aquecimento
│   ├── services/
│   │   ├── whatsappManager.js   # Gerenciador WhatsApp
│   │   ├── messageService.js    # Seleção de mensagens
│   │   ├── delayService.js      # Cálculo de delays
│   │   ├── mediaService.js      # Gerenciamento de mídia
│   │   ├── autoReplyService.js  # Auto-resposta
│   │   └── interactionService.js # Orquestração
│   └── server.js                # Servidor Express
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx    # Dashboard principal
│       │   ├── Accounts.jsx     # Gerenciamento de contas
│       │   ├── Messages.jsx     # Configuração de mensagens
│       │   ├── Media.jsx        # Upload de mídia
│       │   └── Configuration.jsx # Configurações
│       ├── App.jsx              # Componente principal
│       └── index.css            # Estilos globais
├── uploads/                     # Arquivos de mídia
├── warming.db                   # Banco de dados SQLite
└── package.json
```

## 🐛 Solução de Problemas

### QR Code não aparece
- Aguarde alguns segundos após adicionar a conta
- Tente reconectar a conta
- Verifique se o backend está rodando

### Conta desconecta sozinha
- Isso é normal após reiniciar o servidor
- Basta reconectar escaneando o QR code novamente
- As sessões são salvas localmente

### Mensagens não estão sendo enviadas
- Verifique se há pelo menos 2 contas conectadas
- Certifique-se de ter mensagens ativas configuradas
- Verifique se o aquecimento está iniciado no Dashboard

### Erro ao fazer upload de mídia
- Verifique o tamanho do arquivo (máx. 5MB)
- Use formatos suportados: JPG, PNG, GIF, WEBP
- Certifique-se de que a pasta `uploads` existe

## 📝 Licença

MIT

## 🤝 Suporte

Para dúvidas ou problemas, verifique:
1. Os logs do backend no terminal
2. O console do navegador (F12)
3. A documentação acima

---

**Desenvolvido com ❤️ para aquecimento seguro de contas WhatsApp**
