import { ShapeFlags } from '@vue/shared'

// 不关心api层面，可以跨平台
export function createRenderer(renderOptions) {
  // core不关心如何渲染
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp,

  } = renderOptions;

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      patch(null, child, container);
    }
  }
  // 首次创建挂载
  const mountElement = (vnode, container) => {
    const {
      type,
      children,
      props,
      shapeFlag,
     } = vnode;
    console.log(vnode,type);
    const el = hostCreateElement(type);
    console.log(props);
    
    // 处理props
    if(props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }

    // 处理子元素
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) { // 子元素是文本节点
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) { // 子元素有多个
      mountChildren(children, el);
    }

    hostInsert(el, container)
  }

  // 渲染与更新
  const patch = (n1, n2, container) => {
    // n1 旧节点
    // n2 新节点
    if(n1 === n2) {
      return;
    }

    // 旧节点不存在，说明是新增节点
    if (n1 === null) {
      mountElement(n2, container);
    }

  }

  // 多次调用render会进行虚拟节点的对比，然后再进行更新
  const render = (vnode, container) => {
    // 第一次render时，container._vnode为null
    // 后续render时，container._vnode为上一次render的虚拟节点
    patch(container._vnode || null, vnode, container);

    container._vnode = vnode;
  }

  return {
    render
  }

}