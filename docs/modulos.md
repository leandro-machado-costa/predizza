# Módulos e rotas

## Índice de rotas

| Rota | Módulo | Descrição |
| --- | --- | --- |
| `/` | — | Redireciona para `/dashboard` ou `/login` |
| `/login` | Auth | Entrada |
| `/dashboard` | Decisão | Cards 12m / 3 anos / agir agora + ocorrências abertas |
| `/systems` | Fichas | Lista de sistemas |
| `/systems/new` | Fichas | Criar ficha |
| `/systems/[id]` | Fichas | Detalhe, edição, docs e ocorrências do sistema |
| `/occurrences` | Ocorrências | Lista |
| `/occurrences/[id]` | Ocorrências | Detalhe, status, timeline |
| `/modelo` | Modelo | Viewer 3D + registrar no ponto do modelo |
| `/maintenance` | Preventivo | Planos e registro de execução |
| `/works` | Obras | Cadastro e lista |
| `/forecast` | Assembleia | Relatório em linguagem simples + buckets |

## Server Actions

| Arquivo | Ações |
| --- | --- |
| `actions/auth.ts` | `loginAction`, `logoutAction` |
| `actions/systems.ts` | `upsertSystemAction` |
| `actions/occurrences.ts` | `createOccurrenceAction`, `transitionOccurrenceAction` |
| `actions/maintenance.ts` | `createPlanAction`, `runPlanAction` |
| `actions/works.ts` | `createWorkAction` |

## Fluxos principais

### Síndico → assembleia

1. Abre `/dashboard` (não o 3D)
2. Vê totais e “agir agora”
3. Detalha em `/forecast`
4. Navega para ficha, obra ou ocorrência conforme o item

### Técnico → ocorrência no modelo

1. `/modelo` → clica no volume → preenche formulário
2. Ocorrência ganha código `OC-XXXX`, prazo pela prioridade
3. Em `/occurrences/[id]` atualiza status e gera evento

## Componentes de UI

- `AppShell` — marca, edifício, papel, nav, logout
- `ui.tsx` — `PageHeader`, `Card`, `StatCard`, `Field`, botões
- `BuildingMap` — canvas 3D cliente
