# Módulos e rotas

## Mapa de rotas

| Rota | Módulo | Descrição |
| --- | --- | --- |
| `/` | — | Redireciona para `/dashboard` ou `/login` |
| `/login` | Auth | Entrada |
| `/dashboard` | Decisão | Cards 12m / 3 anos / agir agora + ocorrências abertas |
| `/systems` | Fichas | Lista de sistemas |
| `/systems/new` | Fichas | Criar ficha |
| `/systems/[id]` | Fichas | Detalhe, edição, docs e ocorrências do sistema |
| `/delivery` | Construtora | Upload lógico de documentos + criar ficha |
| `/occurrences` | Ocorrências | Lista |
| `/occurrences/[id]` | Ocorrências | Detalhe, status, timeline |
| `/map` | Mapa | Viewer 3D + registrar no ponto |
| `/maintenance` | Preventivo | Planos e registro de execução |
| `/works` | Obras | Cadastro e lista |
| `/forecast` | Assembleia | Relatório em linguagem simples + buckets |

## Server Actions

| Arquivo | Ações |
| --- | --- |
| `actions/auth.ts` | `loginAction`, `logoutAction` |
| `actions/systems.ts` | `upsertSystemAction` |
| `actions/delivery.ts` | `deliveryAction` (documento ± criar sistema com defaults) |
| `actions/occurrences.ts` | `createOccurrenceAction`, `transitionOccurrenceAction` |
| `actions/maintenance.ts` | `createPlanAction`, `runPlanAction` |
| `actions/works.ts` | `createWorkAction` |

## Fluxos principais

### Construtora → mapa

1. Acessa `/delivery`
2. Registra documento (planta/manual/garantia…)
3. Opcionalmente marca “Criar ficha de sistema”
4. Sistema nasce com periodicidade/custo padrão por categoria
5. `rebuildForecast` atualiza a home e a assembleia

### Síndico → assembleia

1. Abre `/dashboard` (não o 3D)
2. Vê totais e “agir agora”
3. Detalha em `/forecast`
4. Navega para ficha, obra ou ocorrência conforme o item

### Técnico → ocorrência no mapa

1. `/map` → clica no volume → preenche formulário
2. Ocorrência ganha código `OC-XXXX`, prazo pela prioridade
3. Em `/occurrences/[id]` atualiza status e gera evento

## Componentes de UI

- `AppShell` — marca, edifício, papel, nav, logout
- `ui.tsx` — `PageHeader`, `Card`, `StatCard`, `Field`, botões
- `BuildingMap` — canvas 3D cliente
