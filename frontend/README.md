# BridgeAI

Plataforma de automação empresarial com inteligência artificial.

## 📋 Sobre o Projeto

Central de automação inteligente para marketing, vendas, atendimento e treinamento em IA.

## 🛠️ Tecnologias Utilizadas

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Node.js** + **Express** - Backend
- **MongoDB** + **Mongoose** - Banco de dados
- **JWT** - Autenticação
- **Framer Motion** - Animações

## 🚀 Como Rodar em Desenvolvimento

### Pré-requisitos

- **Node.js** versão 18 ou superior
- **npm**

### Instalação

1. Instale as dependências do frontend:
```bash
npm install
```

2. Instale as dependências do backend:
```bash
cd server
npm install
cd ..
```

3. Configure as variáveis de ambiente:

Crie um arquivo `.env` na raiz do projeto:
```env
VITE_API_URL=http://localhost:3001
```

Crie um arquivo `server/.env`:
```env
DATABASE_URL=sua-url-do-mongodb
JWT_SECRET=sua-chave-secreta-jwt
PORT=3001
FRONTEND_URL=http://localhost:8080
```

### Execução

1. Inicie o servidor backend:
```bash
cd server
npm run dev
```

2. Em outro terminal, inicie o servidor frontend:
```bash
npm run dev
```

3. Acesse a aplicação em: http://localhost:8080
