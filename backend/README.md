# Sala de Reunião — Backend

API do sistema **Sala de Reunião**. NestJS 11 + Prisma 6 + PostgreSQL, TypeScript
em modo estrito. Autenticação por **login (usuário e senha)**, com sessão em JWT
gravado em cookie httpOnly.

## Pré-requisitos

- Node.js 22+
- PostgreSQL 16 em execução

## Configuração

```bash
cd backend
npm install
cp .env.example .env      # ajuste DATABASE_URL e JWT_SECRET
```

As variáveis de ambiente estão documentadas no `.env.example` e no README da raiz.

## Banco de dados (Prisma)

```bash
npm run prisma:migrate    # cria o schema no Postgres a partir de prisma/schema.prisma
npm run prisma:studio     # (opcional) inspeciona os dados no navegador
```

> Repositório de demonstração: sem migrations versionadas nem seed. O
> `prisma migrate dev` gera o schema; o cadastro inicial fica a seu critério.

## Execução

```bash
npm run start:dev         # http://localhost:3000/api  ·  Swagger em /docs (dev)
```

## Estrutura

```
src/
├── main.ts               Bootstrap, Helmet/CSP, CORS, validação global, Swagger
├── app.module.ts         Módulo raiz e guards globais (Throttler, JwtAuth, Roles)
├── prisma/               PrismaService (conexão) — módulo global
├── auth/                 Login (usuário/senha), JWT em cookie, guards e decorators de acesso
├── products/             Catálogo de produtos
├── purchases/            Pedidos: registro, consulta e soft delete auditado
├── settings/             Categorias de produtos
├── team/                 Equipe com acesso ao painel de gestão
└── health/               Sonda de saúde (verifica o Postgres)
```

## Regras de negócio

- Um **pedido** é feito com o **nome** de quem pediu + os **itens** + a **sala** de
  origem. Não há pagamento, preço nem vínculo com colaborador.
- Os itens guardam **snapshot do nome** no momento do pedido (integridade histórica).
- A exclusão de pedidos é **lógica** (soft delete): permanece a trilha de auditoria
  (`deleted_at`, `deleted_by`, `deletion_reason`).

## Autenticação

Login por **usuário e senha** em `POST /api/auth/login`: em caso de sucesso o
backend emite um JWT de sessão gravado em cookie httpOnly. O perfil é resolvido
contra o cadastro de **Equipe** (`GET /api/auth/me`), e `POST /api/auth/logout`
encerra a sessão limpando o cookie.

> Demonstração: as credenciais são fixas (`admin` / `admin`) e não devem ser
> usadas em produção.
