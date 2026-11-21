# API Predizza

## Autenticação

Header `x-api-key: <PREDIZZA_API_KEY>` (ou `Authorization: Bearer …`).  
Se `PREDIZZA_API_KEY` não estiver definida, a API fica aberta em desenvolvimento.

## Ocorrências

### `GET /api/v1/occurrences?buildingSlug=palmeiras&status=open`

Lista ocorrências do edifício. `status=open` filtra abertas/programadas/em execução.

### `POST /api/v1/occurrences`

```json
{
  "buildingSlug": "palmeiras",
  "title": "Infiltração na garagem",
  "description": "Parede úmida perto das bombas",
  "priority": "alta",
  "systemId": 2
}
```

## WhatsApp (Evolution)

Ver [`whatsapp-evolution.md`](./whatsapp-evolution.md) — `POST /api/whatsapp/webhook`.
