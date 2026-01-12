import { isString, ShapeFlags } from "@vue/shared";

export function isVNode(value) {
  return value.__v_isVNode === true;
}


export function createVNode(
  type,
  props,
  children = null
) {

  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;

  const vnode = {
    __v_isVNode: true,
    type,
    props,
    children,

    // diff算法使用的key
    key: props?.key,

    // 对应真实dom节点
    el: null,
    
    // 节点类型
    shapeFlag,
  };

  if (children) {
    // 数组的话flag添加数组类型标志
    if (Array.isArray(children)) {
      vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    } else {
      // 不是数组直接当作文本节点处理
      children = String(children);
      vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
  }

  return vnode;
}
