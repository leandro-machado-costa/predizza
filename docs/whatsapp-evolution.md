# WhatsApp via Evolution API

A Predizza não fala com o WhatsApp direto: usa a **Evolution API** (open source, QR no celular).

## Fluxo

1. Mensagem no grupo/privado → Evolution → `POST /api/whatsapp/webhook`
2. Predizza tria (heurística ou OpenAI) + dedupe
3. Responde no chat pedindo confirmação humana
4. Alguém responde `Confirmar` / `Vincular` / `Ignorar` (aplica à última triagem pendente)
5. Só então grava ocorrência

## Setup rápido

```bash
cp .env.example .env.local
docker compose up -d
npm run dev
```

1. Abra `http://localhost:8085` (manager da Evolution) com a API key `predizza-evolution-key`.
2. Crie a instância com o mesmo nome de `EVOLUTION_INSTANCE` (ex.: `palmeiras`).
3. Escaneie o QR com o WhatsApp do condomínio/síndica.
4. Configure o webhook da instância:
   - URL: `https://SEU_TUNNEL/api/whatsapp/webhook` (use ngrok/cloudflared se local)
   - Eventos: `MESSAGES_UPSERT`
   - Header `x-webhook-secret`: valor de `EVOLUTION_WEBHOOK_SECRET`
5. Em grupos barulhentos, deixe `EVOLUTION_REQUIRE_MENTION=1` e cite **Predizza** na mensagem.

## Variáveis

| Variável | Função |
| --- | --- |
| `EVOLUTION_API_URL` | Base da API (ex. `http://localhost:8085`) |
| `EVOLUTION_API_KEY` | Header `apikey` |
| `EVOLUTION_INSTANCE` | Nome da instância |
| `EVOLUTION_BUILDING_SLUG` | Edifício Predizza (`palmeiras` no seed) |
| `EVOLUTION_REQUIRE_MENTION` | `1` = só processa se mencionar Predizza |
| `EVOLUTION_WEBHOOK_SECRET` | Auth do webhook |

## Teste sem Evolution

Em **Mais → WhatsApp** há simulação local (mesma triagem, sem envio).

Status da integração: `GET /api/whatsapp/webhook` → `{ configured: true/false }`.
