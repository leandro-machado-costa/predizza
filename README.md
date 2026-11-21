# Predizza

**Chegue na assembleia com o número certo.**  
**O mapa do prédio. A previsão das reformas.**

Predizza é o **kit de assembleia** da síndica: quanto reservar, o que não pode esperar e o que confirmar no WhatsApp — com a memória do prédio viva. A construtora entrega o edifício digitalmente; a síndica decide no celular.

## Entregáveis do evento

| # | Entregável | Link |
| --- | --- | --- |
| 1 | Protótipo / demo do agente | [docs/demo-agente.md](./docs/demo-agente.md) · [vídeo ~86s](./public/demo/predizza-demo.mp4) |
| 2 | BMC (negócio + impacto) | [docs/bmc.md](./docs/bmc.md) |
| 3 | Pitch 3 minutos | [docs/pitch-3min.md](./docs/pitch-3min.md) |
| 4 | Fluxo do agente (abaixo + detalhe) | [docs/agente-fluxo.md](./docs/agente-fluxo.md) |

Checklist: [docs/ENTREGAVEIS.md](./docs/ENTREGAVEIS.md)

---

## Fluxo do agente de IA (inputs → lógica → outputs)

O agente **não grava o grupo inteiro**. Ele tria relatos de manutenção com contexto do edifício e só cria ocorrência após **confirmação humana**.

```text
[WhatsApp / App]
      │
      ▼
 Contexto SQLite (sistemas + OCs abertas do buildingId)
      │
      ▼
 Triagem: nova | duplicata | ignorar
 (heurística própria; OpenAI opcional)
      │
      ▼
 Resposta no chat / fila no app
      │
      ▼
 Humano: CONFIRMAR | VINCULAR | IGNORAR
      │
      ▼
 Ocorrência na Predizza (ou descarte)
```

### Inputs

| Fonte | Como |
| --- | --- |
| WhatsApp | `POST /api/whatsapp/webhook` (Evolution `messages.upsert`) |
| App | `/ai/triage` (texto + foto) ou simulação em `/whatsapp` |
| Confirmação | `Confirmar` / `Vincular` / `Ignorar` no chat (ou botões no app) |

### Lógica

1. Filtra ruído / exige menção opcional (`@Predizza`)  
2. Classifica com keywords + match de duplicata nas OCs abertas  
3. Sugere sistema, prioridade, título e rationale  
4. **Gate humano** antes de persistir ocorrência definitiva  

Código: `src/lib/ai/triage.ts`, `src/lib/whatsapp/inbound.ts`.

### Outputs

| Output | Descrição |
| --- | --- |
| Classificação | `nova` / `duplicata` / `ignorar` |
| Mensagem no grupo | Pedido de confirmação (Evolution) |
| `whatsapp_events` + `ai_suggestions` | Fila e auditoria |
| `occurrences` | Só após CONFIRMAR (source `whatsapp` ou `ai`) |

Documentação completa: [docs/agente-fluxo.md](./docs/agente-fluxo.md).

---

## Stack

- **Next.js** (App Router) · **React** · **TypeScript** · **Tailwind**
- **SQLite** via Drizzle ORM
- **Evolution API** (WhatsApp) · triagem heurística + OpenAI opcional

## Como rodar

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Contas demo (senha `predizza123`):

- `sindico@predizza.demo` — síndica (persona Ana)
- `tecnico@predizza.demo` — técnico
- `construtora@predizza.demo` — construtora

**Demo rápida do agente:** login síndica → Mais → WhatsApp → simular *“Predizza — infiltração na garagem perto da bomba”* → Abrir ocorrência.

## Documentação

Índice em [docs/README.md](./docs/README.md):

- [Produto](./docs/produto.md) · [BMC](./docs/bmc.md) · [IA](./docs/ia.md)
- [Pitch 3 min](./docs/pitch-3min.md) · [Script de apresentação](./docs/script-apresentacao.md) · [8 slides](./docs/pitch-slides.md) · [One-pager](./docs/one-pager-banca.md)
- [WhatsApp / Evolution](./docs/whatsapp-evolution.md) · [API](./docs/api.md)
- [Evento / critérios](./docs/evento-avaliacao.md)

## Problema

Manutenção se perde no WhatsApp e na planilha; troca de síndico apaga a memória; a assembleia decide reserva sem número confiável.

## Solução

**Reserva + risco + confirmação humana** em cima das fichas do edifício. Construtora distribui no handover; síndica usa no celular.

## Diferencial

| Alternativa | Predizza |
| --- | --- |
| Grupo WhatsApp | Fila + confirmação + OC |
| Planilha | Memória no edifício |
| App de boleto | Kit assembleia em R$ |
| CAFM / BIM | IA e decisão **antes** do IFC |

## Estágio atual

App funcional: home kit assembleia, fichas, wizard de entrega, forecast/PDF, triagem IA (foto+texto), agente WhatsApp (Evolution + simulação), planos assistidos, portfólio/lessons (construtora), API `/api/v1/occurrences`.

## Naming

**Predizza** = prédio + predição. Predio360 = MVP histórico (mapa 3D).
