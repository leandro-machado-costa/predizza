# Demo do protótipo — agente de IA

**Entregável:** protótipo funcional (ao vivo ou gravado).

**Gravação passo a passo (cliques + fala + cronômetro):** [`roteiro-gravacao-demo.md`](./roteiro-gravacao-demo.md)

**Conversa WhatsApp fake (HTML para gravar):** http://localhost:3000/whatsapp-demo.html → Modo gravação → Reproduzir

## Preparação (2 min)

```bash
cd /home/leandro/devs/predizza
npm run db:seed   # se precisar resetar demo
npm run dev       # http://localhost:3000
```

1. Login: `sindico@predizza.demo` / `predizza123`  
2. Conferir **Início** com valores em R$  
3. Abrir **Mais → WhatsApp**

## Roteiro ao vivo (60–70 s)

| # | Tela | Ação | O que dizer |
| --- | --- | --- | --- |
| 1 | Início | Mostrar “Reservar” e “Risco se adiar” | “A síndica vê o número da assembleia” |
| 2 | WhatsApp | Colar: `Predizza — infiltração na garagem perto da bomba` → Enviar | “O agente recebe o relato” |
| 3 | Evento | Mostrar classificação / prioridade | “Nova vs duplicata vs ruído, com contexto do prédio” |
| 4 | Confirmar | **Abrir ocorrência** | “Só grava com humano no loop” |
| 5 | Ocorrência / Início | Mostrar OC criada | “Memória confirmada — não é dump do grupo” |

## Gravação (backup)

- Mesmo roteiro, 90 s máx.  
- Resolução mobile ou 1280×720.  
- Se Evolution estiver online, opcional: 10 s mostrando manager em `:8085`.

## Plano B

Se o dev server falhar: screenshots de Início + fila WhatsApp + OC + citar este doc e o fluxo no README.
