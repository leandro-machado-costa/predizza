# Business Model Canvas — Predizza

**Versão:** atualizada para o evento (kit de assembleia + agente WhatsApp)  
**Tipo:** negócio B2B2C (construtora → condomínio) com impacto social na gestão residencial

---

## 1. Parceiros-chave

- Construtoras (handover / pós-obra)
- Administradoras de condomínio
- Evolution API / provedores WhatsApp
- (Futuro) Seguradoras e empresas de manutenção predial

## 2. Atividades-chave

- Manter o **agente de triagem** (WhatsApp + app) com humano no loop
- Gerar e recalcular **forecast** de assembleia
- Onboarding do edifício (wizard de entrega)
- Piloto, suporte à síndica e evolução do modelo de dados

## 3. Recursos-chave

- Software Predizza (Next.js + SQLite)
- Motor de triagem próprio (heurística + LLM opcional)
- Memória do edifício (fichas, OCs, planos)
- Relação com construtoras no momento da entrega
- Persona e jornada validadas (Ana / Ricardo)

## 4. Proposta de valor

| Cliente | Valor |
| --- | --- |
| **Síndica** | Chegar na assembleia com R$ a reservar e risco se adiar; menos WhatsApp como sistema |
| **Construtora** | Entrega digital profissional + aprendizado de pós-obra |
| **Condomínio / sociedade** | Menos surpresa de obra, mais transparência e segurança predial |

**Frase:** *Memória confirmada do prédio + número certo para a assembleia.*

## 5. Relacionamento com clientes

- Onboarding no handover (construtora)
- App mobile-first + resumo semanal
- Confirmação humana no WhatsApp (confiança / LGPD)
- Piloto 30 dias com métricas claras

## 6. Canais

- Construtora (land) — Predizza no pacote de entrega
- Administradora (expand) — carteira de condomínios
- Boca a boca entre síndicas / conselho
- Demo e pitch (AKCIT / eventos)

## 7. Segmentos de clientes

1. **Primário (usuária):** síndica / gestora de condomínio residencial médio  
2. **Pagador inicial (canal):** construtora  
3. **Pagador recorrente:** condomínio ou administradora  
4. Técnico / zelador (usuário operacional)

## 8. Estrutura de custos

- Desenvolvimento e hospedagem do app
- Evolution / infraestrutura WhatsApp
- (Opcional) tokens LLM
- Customer success no piloto
- Aquisição via parceria com construtoras (CAC baixo)

## 9. Fontes de receita

| Fonte | Modelo |
| --- | --- |
| Setup / 1º ano | Embutido no handover da construtora |
| Assinatura | Por edifício / mês ou ano (síndica + técnico) |
| Portfólio | Plano construtora (vários edifícios + lessons learned) |
| (Futuro) | Upsell administradora (carteira) |

**Hipótese de preço (a validar no piloto):** R$ 200–600 / edifício / mês.

---

## Impacto social (além do BMC clássico)

| Impacto | Como |
| --- | --- |
| Segurança | Menos atraso em elevador, bomba, infiltração |
| Transparência | Conselho vê pauta em linguagem simples |
| Continuidade | Memória sobrevive à troca de síndico |
| Inclusão digital da gestão | Celular-first; sem exigir BIM |

---

## Diagrama BMC (visão rápida)

```text
┌─────────────┬──────────────┬────────────────┬──────────────┬─────────────┐
│ Parceiros   │ Atividades   │ Proposta       │ Relação      │ Segmentos   │
│ Construtora │ Agente WA    │ Kit assembleia │ Confirmação  │ Síndica     │
│ Admin       │ Forecast     │ Memória viva   │ humana       │ Construtora │
│ Evolution   │ Wizard       │                │ App + digest │ Admin       │
├─────────────┴──────────────┤                ├──────────────┴─────────────┤
│ Recursos: app, triagem, DB │                │ Canais: handover, admin    │
├────────────────────────────┴────────────────┴────────────────────────────┤
│ Custos: dev, WA, LLM opcional, CS     │ Receita: setup + assinatura     │
└───────────────────────────────────────┴──────────────────────────────────┘
```

Ver também: [`produto.md`](./produto.md) · [`evento-avaliacao.md`](./evento-avaliacao.md)
