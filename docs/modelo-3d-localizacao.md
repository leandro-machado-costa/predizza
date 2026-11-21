# Modelo 3D com localização espacial (Predizza)

Portado do Predio360 / `condominio-digital` (doc `predio360-modelo-3d-localizacao.md`) e integrado ao app Predizza.

## Como usar no app

1. Abra **Modelo** (aba padrão **Modelo**).
2. Toque em **Registrar problema** → toque no ponto (parede, piso, teto, equipamento).
3. Confirme o local → preencha título → a ocorrência grava coordenadas mundo + local + IDs persistentes.

Artefatos gerados:

- `public/modelos/residencial-palmeiras/v1/modelo.glb`
- `public/modelos/residencial-palmeiras/v1/manifesto.json`

Regenerar:

```bash
npm run gerar-modelo
```

## Arquitetura

1. **Gerador** (`tools/gerador`) — spec TS → GLB + manifesto com IDs estáveis.
2. **Manifesto** (`src/shared/model`) — zod; bloco → pavimento → ambiente → elemento.
3. **Visualizador** (`src/features/viewer`) — R3F + camera-controls; técnica casa de bonecas.
4. **Picking** — raio → elemento/ambiente + ponto mundo/local + normal + superfície.
5. **Localização** — gravada em `occurrences` (`loc_*` + `mapX/Y/Z`).

## Convenções

- Metros; **Y para cima, X para leste, Z para sul** (norte = −Z).
- Origem no canto noroeste do bloco; cota 0 no piso do térreo.
- Precisão de milímetro nas coordenadas.

## Abas em `/modelo`

| Aba | Conteúdo |
| --- | --- |
| **Modelo** | Viewer espacial (padrão) |
| Planta | SVG legado |
| Torre | Volume R3F simplificado |
| BIM | IFC (That Open / DigitalHub) |

## Código

Ver `src/features/viewer/`, `src/shared/model/`, `tools/gerador/` e `src/components/ModeloEspacial.tsx`.
