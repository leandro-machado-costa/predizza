# Mapa do edifício exemplo

Projeto demo: **Residencial Jardim das Palmeiras**  
Pasta: [`public/buildings/residencial-palmeiras/`](../public/buildings/residencial-palmeiras/)

## Estratégia (menos falha + mais realismo)

| Vista | Tecnologia | Papel |
| --- | --- | --- |
| **Planta (default)** | SVG + overlay de pins | Síndico / uso diário — sem WebGL |
| **3D** | React Three Fiber | Técnico / contexto espacial |

O manifesto (`manifesto.json`) é a fonte de verdade: pavimentos, ambientes e posição dos sistemas.

## Fluxo no `/map`

1. Toggle **Planta** / **3D**
2. Na planta: escolher pavimento → clicar ambiente ou ponto livre
3. No 3D: órbita + clique no volume
4. Formulário registra ocorrência com `mapX/Y/Z`

## Evolução

- Substituir torre procedural por **GLB** exportado do projeto arquitetônico
- Ou carregar **IFC** (That Open) quando houver modelo BIM da construtora
