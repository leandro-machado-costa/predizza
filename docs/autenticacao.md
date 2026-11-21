# Autenticação e permissões

## Mecanismo

Implementação em [`src/lib/auth.ts`](../src/lib/auth.ts):

1. Login valida e-mail/senha (`bcryptjs`).
2. Cookie `predizza_session` = `userId.timestamp.hmac` (HTTP-only, SameSite=Lax).
3. `getSession()` resolve usuário + membership (edifício + papel).

Segredo: `AUTH_SECRET` (env) ou fallback de desenvolvimento.

## Contas demo (seed)

Senha de todas: **`predizza123`**

| E-mail | Papel | Uso |
| --- | --- | --- |
| `sindico@predizza.demo` | síndico | Home de decisão, assembleia |
| `tecnico@predizza.demo` | técnico | Mapa e ocorrências |
| `construtora@predizza.demo` | construtora | Entrega digital + pós-obra |

Edifício seed: **Residencial Palmeiras** (`slug: palmeiras`).

## Permissões atuais

- Rotas em `(app)` exigem sessão (senão → `/login`).
- Entrega digital: `construtora` ou `sindico`.
- Demais mutações: qualquer usuário autenticado do edifício (MVP).

### Evolução desejada

- Técnico: assumir / iniciar / marcar executada (com foto “depois”).
- Gestor/síndico: confirmar, cancelar, atribuir responsável.
- Fornecedor: leitura de escopo + histórico do sistema.
- Multi-edifício por usuário (hoje 1 membership por login no seed).
