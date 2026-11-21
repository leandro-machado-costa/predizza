# Roadmap

## Princípio

**Decisão → dados → IA → planta/mapa → BIM.**

- Porta de entrada: home de decisão (síndica) / entrega (construtora).
- **IA antes do BIM** — triagem e assembleia não dependem de IFC.
- BIM (That Open) é **secundário e opcional**.

## Já entregue (base Prediza)

- [x] Pitch e naming Prediza
- [x] Next.js + React + SQLite + Drizzle
- [x] Auth por papel + seed
- [x] Home de decisão (12m / 3a / agir agora)
- [x] Fichas de sistema
- [x] Entrega digital da construtora (base)
- [x] Ocorrências + planta / 3D demo (mapa; BIM não é default)
- [x] Manutenção preventiva + obras
- [x] Forecast / relatório de assembleia
- [x] Viewer IFC experimental (That Open) — disponível, não principal
- [x] UX mobile-first (Material-inspired)

## P0 — Dados e adoção

- [x] Wizard de entrega completo
- [x] Onboarding síndica (herda edifício preenchido)
- [x] Export assembleia PDF/WhatsApp
- [x] Convites por papel
- [x] Campos internos só construtora

## P1 — IA (prioridade sobre BIM)

- [x] **Bot WhatsApp no grupo (prioridade)** — Evolution + triagem seletiva + confirmação humana
- [x] Triagem com IA no app (foto + texto → ocorrência sugerida)
- [x] Texto de assembleia com IA
- [x] Plano preventivo assistido + alertas de padrão
- [x] Resumo semanal / notificações (+ SLA construtora)

## P2 — Operação e escala

- [x] Dashboard portfólio construtora
- [x] Pedido de orçamento a partir da ficha
- [x] Lessons learned (CSV)
- [x] Cenários “adiar obra”
- [x] API/webhook (`/api/v1/occurrences` + WhatsApp)

## P3 — BIM / imersão (depois)

- [ ] IFC opcional amadurecido + vínculo elemento ↔ ocorrência
- [ ] Sugerir elemento IFC a partir da triagem
- [ ] Realidade aumentada (AKCIT)

## Visão longa

1. Gestão da informação + previsão (núcleo)
2. IA operacional (triagem, assembleia, planos)
3. Modelo enriquecido (BIM/manuais) quando houver dado
4. Automações / sensores
5. Gêmeo digital
