# Roteiro de gravação — Demo Predizza (agente de IA)

**Duração alvo do vídeo:** 90–120 segundos (máx. 2 min)  
**Formato:** tela do navegador + sua voz (ou voz em off depois)  
**Objetivo:** mostrar o **agente** (WhatsApp → triagem → confirmação → ocorrência) e o **kit assembleia** (R$).

---

## Antes de gravar (checklist — 5 min)

### Ambiente

- [ ] Fechar notificações (Slack, e-mail, WhatsApp desktop)
- [ ] Zoom do navegador **100%** (ou 110% se a letra ficar pequena na gravação)
- [ ] Janela em **1280×720** ou tela cheia limpa
- [ ] Tema do SO sem distração; ocultar bookmarks bar se possível

### App

```bash
cd /caminho/para/predizza
npm run db:seed    # dados limpos e previsíveis
npm run dev        # http://localhost:3000
```

- [ ] Abrir http://localhost:3000/login
- [ ] Testar **uma vez** o fluxo completo (ensaio sem gravar)
- [ ] Texto da mensagem já na área de transferência:

```text
Predizza — infiltração na garagem perto da bomba, parede úmida
```

### Ferramenta de gravação (escolha uma)

| Ferramenta | Dica |
| --- | --- |
| **OBS Studio** | Cena: Display Capture · mic · gravar em MP4/MKV |
| **SimpleScreenRecorder** / Kazam | Linux simples |
| **Chrome** → `chrome://webrtc-internals` não; use extensão ou OBS |
| **Telefone filmando o monitor** | Só se não houver outra opção (evitar) |

**Áudio:** microfone a ~20 cm; teste 5 s e ouça.  
**Resolução:** 1280×720 ou 1920×1080, **30 fps**.

---

## Estrutura do vídeo (cronômetro)

| Tempo | Bloco | Tela |
| --- | --- | --- |
| 0:00–0:15 | Gancho + login | Login → Início |
| 0:15–0:35 | Kit assembleia | Início (números em R$) |
| 0:35–1:25 | **Agente** | WhatsApp → confirmar → OC |
| 1:25–1:45 | Fecho | Início ou Assembleia |
| 1:45–2:00 | Corte / logo | Opcional |

Se precisar **≤ 90 s**, corte o fecho e fale o gancho em 8 s.

---

## Passo a passo (cliques + fala)

### Take único — leia a fala enquanto clica

#### 1) Login (0:00–0:15)

1. Tela de login já aberta (conta `sindico@predizza.demo` preenchida).
2. Clicar **Entrar**.
3. Esperar o **Início** carregar.

**Fala:**  
“A Predizza é o kit de assembleia da síndica. Vou mostrar o número certo — e o agente que tira a manutenção do WhatsApp com confirmação humana.”

---

#### 2) Início — valor (0:15–0:35)

1. Scroll leve se precisar para mostrar o card grande **Reservar**.
2. Apontar com o cursor: “Reservar (12 meses)” e “Risco se adiar”.
3. Mostrar por 1 s o card **WhatsApp** da semana (fila).

**Fala:**  
“Aqui a Ana vê quanto reservar e o risco se adiar — linguagem de assembleia, não de engenharia.”

---

#### 3) Agente WhatsApp — conversa HTML (0:35–1:25)  ← recomendado para gravação

1. Abrir nova aba: http://localhost:3000/whatsapp-demo.html  
2. Clicar **Modo gravação** (tela cheia do telefone)  
3. Clicar **▶ Reproduzir** e narrar enquanto as bolhas aparecem  

**Fala (durante a animação):**  
“No grupo, o morador relata a infiltração. A síndica marca a Predizza. O agente tria com o contexto do prédio — classificação nova, prioridade alta — e pede confirmação. Ana responde CONFIRMAR. Só então a ocorrência nasce. Memória com consentimento — não é dump do grupo.”

**Alternativa (app real):** Mais → WhatsApp → simular mensagem → Abrir ocorrência (mesmo roteiro de antes).

---

#### 5) Fecho (1:25–1:45)

1. Clicar **Início** (ou Assembleia se quiser mostrar pauta).
2. Parar 2 s na home.

**Fala:**  
“Construtora entrega o prédio digital; a síndica decide. Predizza: assembleia com o número certo.”

3. Parar a gravação.

---

## Depois de gravar

- [ ] Assistir **sem som** (legibilidade) e **com som** (ruído)
- [ ] Cortar inícios/fins mortos (0,5 s de folga)
- [x] Exportar unificado: [`public/demo/predizza-demo.mp4`](../public/demo/predizza-demo.mp4) (~2 min 49 s — agente + WhatsApp)
- [ ] Guardar backup do take bruto (gravações cruas na raiz, ignoradas pelo git)

### Legendas (opcional, mas ajuda banca)

Faixa curta:
1. Kit assembleia em R$  
2. Agente tria o relato  
3. Humano confirma → ocorrência  

---

## Plano B (se algo quebrar na hora)

| Problema | Ação |
| --- | --- |
| Triagem deu `ignorar` | Usar exatamente o texto com “infiltração” e “bomba”; incluir “Predizza” |
| Deu `duplicata` | `npm run db:seed`, gravar de novo |
| Tela lenta | Esconder Network do DevTools; fechar abas |
| Sem voz boa | Gravar só tela e narrar depois no CapCut/DaVinci |

---

## Versão “super curta” (60 s)

1. Início — 10 s (R$)  
2. WhatsApp simular + enviar — 20 s  
3. Confirmar → OC — 20 s  
4. “Humano no loop / número da assembleia” — 10 s  

---

## Take 2 (opcional) — Evolution real

Só se o WhatsApp já estiver conectado no manager `:8085`:

1. 5 s no manager Evolution  
2. Mensagem real no celular  
3. Fila Predizza atualizando  

**Não misture** no mesmo take se a conexão estiver instável — use o take da simulação como oficial.

---

## Ensaio

Fazer **2 ensaios cronometrados** sem gravar.  
Só aperta REC no terceiro.

Boa gravação.
