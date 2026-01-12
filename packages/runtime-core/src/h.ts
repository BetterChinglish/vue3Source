import { isArray } from '@vue/shared';
import { isObject } from '@vue/shared'
import { createVNode, isVNode } from './createVNode';

export function h(type, propsOrChildren, children?) {

  let len = arguments.length;

  // 只有两个参数
  if (len === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      
      // 第二个参数为vnode
      if(isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }

      // 第二个参数为属性
      return createVNode(type, propsOrChildren);
    } else {
      // 数组或者文本
      return createVNode(type, null, propsOrChildren);
    }

   
  } else {
    if (len > 3) {
      children = Array.prototype.slice.call(arguments, 2);
    }
    // 长度为3且第三个参数为vnode的时候将其包装成数组
    else if (len === 3 && isVNode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  } 
}