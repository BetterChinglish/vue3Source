import {isObject, isString, ShapeFlags} from "@vue/shared";

export function isVNode(value) {
  return value.__v_isVNode === true;
}

export const Text = Symbol('Text');

export const Fragment = Symbol('Fragment');

/**
 * 判断是否为相同的vnode
 * @param n1 - 旧节点
 * @param n2 - 新节点
 * @returns {Boolean} 是否为相同的vnode
 */
export function isSameVNode(n1, n2): boolean {
  return n1.type === n2.type && n1.key === n2.key;
}

// 提供给h方法创建vnode
export function createVNode(
  type,
  props,
  children = null
) {

  // 为了便于查看改为if else的形式，之前是三元表达式
  // const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;
  let shapeFlag;
  // type为字符串说明是普通标签
  if(isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT;
  } else {
    if(isObject(type)) {
      // 带状态的组件，区别于函数式组件
      shapeFlag = ShapeFlags.STATEFUL_COMPONENT;
    } else {
      shapeFlag = 0;
    }
  }

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
