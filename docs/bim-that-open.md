# BIM com That Open (ex-IFC.js)

## Posição no produto

**BIM não é o principal.** Ordem oficial:

`Decisão → dados → IA → planta/modelo → BIM`

- A aba BIM no `/modelo` existe como **detalhe opcional**.
- Default do modelo = **Planta**.
- Roadmap de **IA (P1) vem antes** de amadurecer IFC (P3).
- Entrega da construtora e assembleia da síndica **não dependem** de IFC.

## Stack

| Pacote | Função |
| --- | --- |
| `@thatopen/components` | Worlds, câmera, renderer, IfcLoader |
| `@thatopen/fragments` | Formato binário leve para web |
| `web-ifc` | Parser IFC (WASM) |
| `three` | Motor 3D |

WASM em `public/wasm/` (`web-ifc.wasm`, `web-ifc-mt.wasm`).

### Next.js / bundler

- Dev/build com **webpack** (`next dev --webpack`) — Turbopack quebra nos exports WebGPU do Three usados pelo Fragments.
- Shim [`src/lib/three-predizza.js`](../src/lib/three-predizza.js) aliasado em `three$` para expor `MRTNode` / `TSL` / `WebGPURenderer`.

## Onde está no app

- Viewer: [`src/components/IfcViewer.tsx`](../src/components/IfcViewer.tsx)
- Aba **BIM (IFC)** em `/modelo`
- Modelos: `public/buildings/residencial-palmeiras/bim/`
  - `DigitalHub_FM-ARC_v2.ifc` — **padrão** (~8,7 MB, [RWTH-E3D/DigitalHub](https://github.com/RWTH-E3D/DigitalHub) v2 FM-ARC)
  - `school_str.ifc` — exemplo estrutural (~8 MB, That Open)
  - `just_wall.ifc` — IFC mínimo para smoke test

## Fluxo

```text
IFC → web-ifc (WASM) → Fragments → Three.js na tela
```

A conversão IFC→Fragments na primeira carga é pesada; em produção o ideal é pré-gerar `.frag` e carregar só o fragmento.

## Trocar pelo edifício real

1. Exporte IFC (2x3 ou 4) do Revit/Archicad/etc.
2. Coloque em `public/buildings/<slug>/bim/modelo.ifc`
3. Ajuste `BIM_OPTIONS` em `ModeloClient.tsx` (ou manifesto)

## Próximos passos

- [ ] Clique no elemento IFC → GUID → ficha/ocorrência
- [ ] Pré-conversão IFC→`.frag` no upload da construtora
- [x] Modelo BIM demo real: DigitalHub FM-ARC v2 (RWTH E3D)
- [ ] Trocar pelo IFC residencial do cliente no handover
