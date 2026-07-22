# Sala de Reunião — Frontend

SPA do sistema **Sala de Reunião**: quiosque de autoatendimento por sala (sem
login) e painel de gestão (login por usuário e senha).

## Tecnologias

- [React 19](https://react.dev/) + [React Router](https://reactrouter.com/)
- [Vite](https://vitejs.dev/) (bundler e servidor de desenvolvimento)
- [TypeScript](https://www.typescriptlang.org/) (modo estrito)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [@tanstack/react-query](https://tanstack.com/query) (cache de dados) e
  [lucide-react](https://lucide.dev/) (ícones)

## Pré-requisitos

- Node.js 22 ou superior
- npm 10 ou superior

## Como executar

```bash
npm install       # instala as dependências
npm run dev       # inicia o servidor de desenvolvimento (http://localhost:5173)
```

## Scripts disponíveis

| Script              | Descrição                                    |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento com HMR          |
| `npm run build`     | Verifica os tipos e gera o build de produção |
| `npm run preview`   | Serve localmente o build de produção         |
| `npm run typecheck` | Verificação de tipos (sem gerar arquivos)    |
| `npm run lint`      | Análise estática com ESLint                  |
| `npm run format`    | Formatação do código com Prettier            |

## Estrutura

```
src/
├── app/        Quiosque por sala e painel de gestão (seções e telas)
├── api/        Cliente HTTP da API
├── hooks/      Hooks de dados (React Query)
├── lib/        Utilitários (ordenação, WhatsApp, query client)
├── assets/     Imagens e logotipos
├── styles/     Estilos globais e tema (Tailwind)
└── main.tsx    Ponto de entrada e rotas
```
