# Arquitetura

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| Banco | SQLite (`better-sqlite3`) |
| ORM | Drizzle ORM |
| 3D | Three.js + React Three Fiber + Drei |
| Auth | Cookie HTTP-only assinado (HMAC) + bcrypt |
| Datas | date-fns |

Arquivo do banco (dev): `data/predizza.sqlite`.

## Diagrama lógico

```mermaid
flowchart TB
  Browser[Browser]
  App[Nextjs App Router]
  Actions[Server Actions]
  Lib[lib auth forecast format]
  DB[(SQLite)]
  R3F[BuildingMap R3F]

  Browser --> App
  App --> Actions
  App --> Lib
  Actions --> Lib
  Actions --> DB
  Lib --> DB
  Browser --> R3F
```

## Estrutura de pastas

```text
src/
  app/
    (app)/           # rotas autenticadas (shell + páginas)
      dashboard/     # home de decisão
      systems/       # fichas de sistema
      modelo/        # viewer espacial + ocorrência no ponto
      occurrences/   # ocorrências
      map/           # modelo 3D + registro
      maintenance/   # preventivo NBR 5674
      works/         # obras NBR 16280
      forecast/      # relatório assembleia
    actions/         # server actions (mutações)
    login/
  components/        # AppShell, BuildingMap, UI
  db/                # schema, conexão, seed
  lib/               # auth, forecast, format
data/                # SQLite local (gitignored)
docs/                # esta documentação
```

## Padrões

- **Server Components** para leitura (páginas listam direto via Drizzle).
- **Server Actions** para escrita (`src/app/actions/*`).
- Layout `(app)` exige sessão (`dynamic = "force-dynamic"`).
- Isolamento por `buildingId` da membership do usuário logado.
- Previsão recalculada por `rebuildForecast(buildingId)` após mudanças em sistemas, planos, obras ou entrega.

## Modelo 3D (espacial)

Padrão em `/modelo`: viewer **casa de bonecas** (`src/features/viewer`) + GLB gerado (`npm run gerar-modelo` → `public/modelos/...`). Toque grava localização com IDs persistentes (`loc_*` em `occurrences`). Detalhe: [`modelo-3d-localizacao.md`](./modelo-3d-localizacao.md).

Aba **Torre** ainda usa [`BuildingMap.tsx`](../src/components/BuildingMap.tsx) (volume simplificado). Aba **BIM** = IFC via That Open.
