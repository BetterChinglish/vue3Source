import { nodeOps } from "./nodeOps"
import patchProp from "./patchProp"

import { createRenderer } from '@vue/runtime-core'

const renderOptions = Object.assign({ patchProp }, nodeOps);

// render方法使用dom api进行渲染
export const renderer = (vnode, container) => {
  return createRenderer(renderOptions).render(vnode, container);
}

export * from "@vue/runtime-core"
// runtime-dom 引用 runtime-core
// runtime-core引用 @vue/reactivity