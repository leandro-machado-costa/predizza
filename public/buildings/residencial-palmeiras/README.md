# Residencial Jardim das Palmeiras (projeto exemplo)

Edifício residencial multifamiliar de demonstração da Predizza.

## Tipologia

- Torre única
- Subsolo técnico (bombas)
- Térreo (portaria, salão, hall)
- 8 pavimentos tipo (4 apartamentos por andar)
- Cobertura técnica (casa de máquinas, reservatório, SPDA)

## Arquivos

| Arquivo | Uso |
| --- | --- |
| `manifesto.json` | Dimensões, pavimentos, ambientes (u,v), sistemas |
| `plantas/terreo.svg` | Planta do térreo |
| `plantas/tipo.svg` | Pavimento tipo |
| `plantas/cobertura.svg` | Cobertura técnica |
| `plantas/subsolo.svg` | Subsolo / bombas |

## Como o app usa

1. **Planta (padrão):** SVG + pins de ambiente — estável em qualquer dispositivo.
2. **3D:** torre residencial gerada a partir do manifesto (janelas, base, cobertura).
3. Sistemas do banco alinham por `category` = `systems[].key` do manifesto.

## BIM (That Open)

Pasta `bim/`:

- `school_str.ifc` — modelo exemplo (That Open)
- `just_wall.ifc` — IFC mínimo

No app: aba **BIM (IFC)** em `/map` usa `@thatopen/components` + `web-ifc`.

## Trocar por um prédio real

1. Exporte IFC do projeto e coloque em `bim/`.
2. (Opcional) Mantenha plantas SVG por pavimento para fallback sem WebGL.
3. Ajuste `floors[].spaces` com coordenadas normalizadas `u,v` (0–1).
