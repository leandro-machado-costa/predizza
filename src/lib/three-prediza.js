/**
 * Shim de three.js para @thatopen/fragments no Next.js.
 * Importa o build principal por caminho direto (evita loop com o alias `three`)
 * e anexa símbolos WebGPU/TSL que o Fragments espera no namespace THREE.
 */
export * from "../../node_modules/three/build/three.module.js";
export {
  MRTNode,
  OutputStructNode,
  NodeMaterial,
  WebGPURenderer,
} from "../../node_modules/three/build/three.webgpu.js";
export * as TSL from "../../node_modules/three/build/three.tsl.js";
