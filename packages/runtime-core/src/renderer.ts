import { ShapeFlags } from '@vue/shared';
import { isSameVNode } from './createVNode';

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
    const {type, children, props, shapeFlag} = vnode

    const el = vnode.el = hostCreateElement(type)

    // 处理props
    if(props) {
      for(const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }

    // 处理子元素
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 子元素是文本节点
      hostSetElementText(el, children);
    }else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 子元素有多个
      mountChildren(children, el);
    }

    hostInsert(el, container)
  }


  const processElement = (n1, n2, container) => {
    // 旧节点不存在，说明是新增节点
    if (n1 === null) {
      mountElement(n2, container);
    }
    else {
      patchElement(n1, n2, container);
    }
  }

  const patchProps = (oldProps, newProps, el) => {
    // hostPatchProp()
    // 将老的属性中有新的属性进行更新
    for(const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }

    // 将旧的但是新的没有的属性删除
    for(const key in oldProps) {
      if(!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }

  }

  const unmountChildren = (children) => {
    for(let i = 0; i < children.length; i++) {
      const child = children[i];
      unmount(child);
    }
  }

  /*
  * @param n1 旧节点
  * @param n2 新节点
  * @param container 容器元素
  * */
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children;
    const c2 = n2.children;

    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    // 9种组合
    /*
    * 新      旧      操作
    * 文本    数组    清空老节点，设置文本
    * 文本    文本    设置新文本
    * 文本    空      设置新文本
    *
    * 数组    数组    diff算法
    * 数组    文本    清空文本，挂载新节点
    * 数组    空      挂载新节点
    *
    * 空      文本    清空文本
    * 空      数组    清空节点
    * 空      空      不做处理
    *
    * */

    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      console.log('新的是文本')
    } else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      console.log('新的是数组')
    } else {
      console.log('新的是空')
    }
    if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      console.log('老的是文本')
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      console.log('老的是数组')
    } else {
      console.log('老的是空')
    }

    // if 新节点是文本
    // 老的是数组 或 文本 或 空
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      const oldIsArray = prevShapeFlag & ShapeFlags.ARRAY_CHILDREN;
      // 旧节点是数组, 需要全部卸载, 然后设置新文本
      if(oldIsArray) {
        unmountChildren(c1)
      }
      // 否则旧节点是文本或者空, 直接设置新文本

      console.log('新的是文本，老的是文本或空')
      if(c1 !== c2) {
        hostSetElementText(el, c2);
      }
    }
    // else 新的子节点是数组或空
    // 老的是数组 或 文本 或 空
    else {
      // 老的是数组
      // 新的是数组或空
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 新的是数组
        // 老的是数组
        if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // diff
        }
        // 新的是空
        // 老的是数组 ---> 卸载老的
        else{
          unmountChildren(c1);
        }
      }
      // 新的是数组或空
      // 老的是文本或空
      else {
        // 老的是文本, 需要删除文本
        if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '');
        }
        // 新的是数组, 需要挂载新元素
        if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  }

  const patchElement = (n1, n2, container) => {
    // 复用dom元素
    let el = n2.el = n1.el;
    // 比较属性和元素子节点
    const oldProps = n1.props || {};
    const newProps = n2.props || {};

    // 更新属性

    patchProps(oldProps, newProps, el);
    patchChildren(n1, n2, el);

  }

  /**
   * 渲染与更新
   * @param n1 - 旧节点
   * @param n2 - 新节点
   * @param container - 容器元素
   */
  const patch = (n1, n2, container) => {
    if(n1 === n2) {
      return;
    }

    // 渲染过一次，需要查看上一次的节点和这次的节点是否相同，如果不同就卸载重新挂载
    if(n1 && !isSameVNode(n1, n2)) {
      unmount(n1);
      // n1为null会重新执行mountElement
      n1 = null;
    }

    processElement(n1, n2, container);
  }

  /**
   * 卸载节点
   * @param vnode - 要卸载的虚拟节点
   */
  const unmount = (vnode) => {
    hostRemove(vnode.el);
  }

  // 多次调用render会进行虚拟节点的对比，然后再进行更新
  /**
   * 渲染函数
   * @param vnode - 要渲染的虚拟节点
   * @param container - 容器元素, 要渲染的节点会挂载到该容器元素下
   */
  const render = (vnode, container) => {
    if (vnode === null) {
      // 说明是删除当前容器里的节点
      if(container._vnode) {
        unmount(container._vnode);
      }
    }

    // 第一次render时，container._vnode为null
    // 后续render时，container._vnode为上一次render的虚拟节点
    patch(container._vnode || null, vnode, container);

    container._vnode = vnode;
  }

  return {
    render
  }
}