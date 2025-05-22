# Portfolio Enterprise Backend

Sistema backend empresarial avanÃ§ado para portfÃ³lio profissional.

## Funcionalidades

- í´ AutenticaÃ§Ã£o JWT com refresh tokens
- í³Š Analytics em tempo real
- í´„ WebSocket para comunicaÃ§Ã£o em tempo real
- í³§ Sistema de email com templates
- í³ Upload de arquivos com processamento de imagem
- í´ Sistema de busca avanÃ§ado
- í»¡ï¸ SeguranÃ§a empresarial
- í³ˆ Monitoramento de performance
- í´„ Sistema de backup automÃ¡tico
- í·ª Testes automatizados

## Requisitos

- Node.js 18+
- Docker & Docker Compose
- MongoDB
- Redis

## InstalaÃ§Ã£o

1. Clone o repositÃ³rio
2. Copie `.env.example` para `.env`
3. Configure as variÃ¡veis de ambiente
4. Execute: `npm install`

## Desenvolvimento

```bash
# Desenvolvimento local
npm run dev

# Com Docker
npm run docker:dev
```

## ProduÃ§Ã£o

```bash
# Deploy com Docker
npm run deploy

# Ou manualmente
npm run build
npm start
```

## Testes

```bash
# Todos os testes
npm test

# Testes de integraÃ§Ã£o
npm run test:integration

# Coverage
npm run test:coverage
```

## Estrutura do Projeto

```
src/
â”œâ”€â”€ controllers/     # Controladores da API
â”œâ”€â”€ services/        # ServiÃ§os de negÃ³cio
â”œâ”€â”€ models/          # Modelos de dados
â”œâ”€â”€ middlewares/     # Middlewares customizados
â”œâ”€â”€ routes/          # DefiniÃ§Ãµes de rotas
â”œâ”€â”€ utils/           # UtilitÃ¡rios
â”œâ”€â”€ types/           # Tipos TypeScript
â””â”€â”€ config/          # ConfiguraÃ§Ãµes
```

## API Documentation

Acesse `/docs` para ver a documentaÃ§Ã£o da API.

## Health Check

Acesse `/health` para verificar o status do sistema.
