# Script de apresentação — Predizza

**Duração total:** ~3 minutos  
**Telas:** app (Início) → HTML WhatsApp → (opcional) OC no app  
**Antes:** `npm run dev` · login `sindico@predizza.demo` / `predizza123` · abas prontas:

1. http://localhost:3000/dashboard  
2. http://localhost:3000/whatsapp-demo.html (Modo gravação já ligado se for vídeo)

---

## Cronômetro

| Tempo | Bloco | O que está na tela |
| --- | --- | --- |
| 0:00–0:30 | Problema + persona | Capa / Início |
| 0:30–0:55 | Solução | Início (R$) |
| 0:55–2:20 | Demo agente | WhatsApp HTML |
| 2:20–2:45 | Diferencial + negócio | Volta ao Início ou slide |
| 2:45–3:00 | Pedido | Slide final / contato |

---

## Texto para falar (decorar)

### 1. Abertura — 0:00 a 0:30

> Bom dia. Em quase todo condomínio a manutenção mora no **WhatsApp** e a assembleia decide **no escuro**.
>
> Eu sou da **Predizza**. Nossa persona é a Ana, síndica: ela não quer BIM — ela quer **não passar vergonha** e saber **quanto reservar**.

*(Trocar para a home do app.)*

---

### 2. Solução — 0:30 a 0:55

> A Predizza é o **kit de assembleia**: a construtora entrega o prédio digitalmente; a síndica vê, em reais, o que **reservar** nos próximos doze meses e o **risco se adiar**.
>
> A memória do prédio fica viva — e o WhatsApp deixa de ser o sistema.

*(Abrir a aba do WhatsApp demo · Reproduzir.)*

---

### 3. Demo do agente — 0:55 a 2:20

Fale **enquanto** as bolhas aparecem. Não leia a tela palavra por palavra.

> Aqui está o **agente**.  
> O morador manda a **foto** da infiltração no teto da garagem.  
> A Ana marca a Predizza.  
> O agente usa o contexto do edifício — sistemas e ocorrências abertas — classifica como **nova**, prioridade **alta**, e pede confirmação.  
> Ana responde só: **Confirmar**.  
> Aí nasce a ocorrência **OC-0003** — memória com consentimento, não dump do grupo.  
>
> Quando o serviço termina, o operador registra a resolução com **foto do teto seco** e um texto curto.  
> Só esse fechamento volta ao grupo. O morador agradece. Ciclo fechado.

*(Se sobrar 5 s: mostrar OC-0003 no app com as duas fotos.)*

---

### 4. Diferencial e negócio — 2:20 a 2:45

> Diferente de portal de boleto ou de CAFM caro: entramos no **handover da construtora** e expandimos com a administradora. O lock-in é o **histórico confirmado** do edifício.

---

### 5. Fecho — 2:45 a 3:00

> Pedimos um piloto: **um edifício, trinta dias** — uma pauta de assembleia exportada e relatos confirmados no app.  
> Predizza: **chegue na assembleia com o número certo.** Obrigado.

---

## Versão curta (se cortarem para 2 min)

Use só estes blocos:

1. Problema WhatsApp + assembleia (15 s)  
2. Kit assembleia em R$ na home (20 s)  
3. Demo: foto → Confirmar → conclusão com foto seca (70 s)  
4. Piloto 30 dias (15 s)  

---

## Versão longa (se derem 5 min)

Depois do fecho curto, acrescente:

> No app, a triagem também aceita foto; a assembleia vira PDF; a construtora vê lessons learned. BIM existe, mas **depois** da decisão — a porta de entrada é o número, não o modelo 3D.

---

## Cartões de apoio (se a banca perguntar)

| Pergunta | Resposta em 1 frase |
| --- | --- |
| E a LGPD? | Só gravamos o que a síndica confirma. |
| Por que não ChatGPT puro? | Contexto do edifício no SQLite + heurística própria; LLM é opcional. |
| Quem paga? | Land na construtora; expand no condomínio/administradora. |
| E se o grupo for barulhento? | Exigimos menção à Predizza; ruído é classificado como ignorar. |

---

## Checklist 2 minutos antes

- [ ] Seed ok · OC-0003 existe  
- [ ] `/whatsapp-demo.html` abre e **Reproduzir** mostra foto molhada + foto seca  
- [ ] “Confirmar” (sem número) na conversa  
- [ ] Microfone / slides / one-pager à mão  
- [ ] Plano B: este script impresso se a demo travar  

Boa apresentação.
