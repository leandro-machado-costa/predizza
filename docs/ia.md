# IA na Prediza

## Princípio

IA **antes** do BIM. Serve Ana (assembleia/triagem) e Ricardo (plano/padrões) em cima de fichas e ocorrências — sem exigir IFC.

Ordem: **Decisão → dados → IA → planta → BIM**.

## Prioridade: bot WhatsApp no grupo

Faz sentido como **captura**, não como gravador do grupo.

### O que é

Bot no grupo do condomínio que:

1. Detecta mensagem/foto com cara de manutenção (ou comando `@Prediza registrar`).
2. Classifica **ocorrência nova** vs **duplicata** (OC aberta no mesmo edifício: sistema/local/texto parecido).
3. Responde no grupo com card: *Confirmar nova / Vincular à OC-… / Ignorar*.
4. **Só grava na Prediza** se síndica/zelador confirmar.

### O que não é

- Escutar e arquivar **tudo** do grupo (festa, ofensa, ruído).
- Criar ocorrência sozinho a cada mensagem.
- Substituir o grupo — o grupo continua; a Prediza guarda só manutenção confirmada.

### Por quê (personas)

- **Ana:** a ocorrência já nasce no WhatsApp; sem bot, o app fica incompleto.
- **Ricardo:** melhor sinal na garantia se o condomínio registrar cedo e sem duplicata.

### Riscos controlados

| Risco | Mitigação |
| --- | --- |
| LGPD / “bot espião” | Confirmação humana; não armazenar mensagens irrelevantes |
| Ruído | Classificador + ignore; não dump |
| Custo de LLM | Só processa candidatas (foto ou keywords / menção ao bot) |
| Duplicata | Match com `occurrences` abertas do `buildingId` |

### Backlog

Item **P1 #6 (prioridade)** em [`personas.md`](./personas.md) e [`roadmap.md`](./roadmap.md).

Implementação: **Evolution API** (ver [`whatsapp-evolution.md`](./whatsapp-evolution.md)) → webhook Next.js → triagem IA + dedupe SQLite → resposta pedindo `CONFIRMAR` / `VINCULAR` / `IGNORAR`.

## Outros casos P1

1. **Triagem no app** — foto + texto → tipo, prioridade, sistema, descrição (humano confirma).
2. **Assembleia** — forecast + abertas → pauta em linguagem simples.
3. **Plano / padrões** — sugestão de preventiva; alerta se ocorrência se repete.

## Arquitetura (geral)

Server Action / webhook → contexto do `buildingId` (SQLite) → API de IA → sugestão → UI ou card WhatsApp confirma → grava ocorrência.

## Relação com BIM

| Sem IFC | Com IFC (depois) |
| --- | --- |
| IA sugere sistema/ficha | IA pode sugerir elemento no modelo |
| Pin na planta | Pin + destaque no viewer That Open |

Nunca bloquear triagem, WhatsApp ou assembleia por falta de modelo.
