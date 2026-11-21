# Desenvolvimento

## Pré-requisitos

- Node.js 20+ (testado com 24)
- npm

## Setup

```bash
cd /home/leandro/devs/predio360
npm install
npm run db:push    # cria data/ e aplica schema
npm run db:seed    # condomínio + usuários + dados demo
npm run dev        # http://localhost:3000
```

## Scripts

| Script | Função |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (**webpack** — necessário para That Open) |
| `npm run build` | Build de produção |
| `npm run start` | Sobe o build |
| `npm run lint` | ESLint |
| `npm run db:push` | Aplica schema no SQLite |
| `npm run db:seed` | Reseta/popula dados demo |
| `npm run db:studio` | Drizzle Studio |

## Variáveis de ambiente (opcional)

Crie `.env.local`:

```env
DATABASE_URL=./data/prediza.sqlite
AUTH_SECRET=troque-em-producao
```

## Configuração relevante

- [`next.config.ts`](../next.config.ts) — `serverExternalPackages: ["better-sqlite3"]`
- [`drizzle.config.ts`](../drizzle.config.ts) — dialect sqlite + path do banco
- Banco e WAL em `data/` (ignorados pelo git)

## Seed

[`src/db/seed.ts`](../src/db/seed.ts) apaga e recria:

- 1 edifício, 3 usuários, memberships
- sistemas (elevadores, bombas, fachada, SPDA, reservatório)
- documentos, planos, obra de fachada, 2 ocorrências
- `rebuildForecast`

## Convenções

- Idioma da UI: português (Brasil)
- Moeda: BRL (`formatBRL`)
- Server Actions após mutação: `revalidatePath` + `redirect`
- Não commitar `data/*.sqlite`
