import { ShapeFlags } from '@vue/shared';
import { isSameVNode } from './createVNode';
import getSequence from "./seq";

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
  const mountElement = (vnode, container, anchor) => {
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

    hostInsert(el, container, anchor);
  }


  const processElement = (n1, n2, container, anchor) => {
    // 旧节点不存在，说明是新增节点
    if (n1 === null) {
      mountElement(n2, container, anchor);
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
  * @param c1 旧子节点数组
  * @param c2 新子节点数组
  * @param el 容器元素
  * */
  const patchKeyedChildren = (c1, c2, el) => {
    // 原理类似vue2，先双端对比，再复杂diff
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    
    // 从前往后比对, 挪动i
    while(i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      // 如果是同一个节点，就复用元素patch更新元素内容
      if(isSameVNode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }
    
    // 从后往前比对, 挪动e1和e2
    while(i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if(isSameVNode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    
    // 经过上面两个循环后我们会得到前后绝对没有相同节点的两个数组，其中i为这两个数组的起始下标，而e1和e2分别为旧节点和新节点数组的结束下标
    // 但是倘若i大于e1或e2，说明某一方已经比对完毕了，接下来就只需要处理另一方剩下的节点即可
    // 如果i大于e1，说明旧节点已经比对完毕，接下来只需要将新节点剩下的节点进行挂载即可 ---- 只有新增且新增的节点连续
    // 如果i大于e2，说明新节点已经比对完毕，接下来只需要将旧节点剩下的节点进行卸载即可 ---- 只有删除且删除的节点连续
    // 例如： a,b,c,d  和 a,b,e,f,c,d, 此时i=2，e1 = 1， e2= 3
    
    // 如果是纯连续新增，则i大于e1且i小于等于e2
    // 如果是纯连续删除，则i大于e2且i小于等于e1
    if(i > e1) { // 新增
      if(i <= e2) {
        // 新增有两种情况，一种是后面插入a b->a b x x，另一种是前面插入a b->x x a b，还有可能是中间插入 a b c d -> a b x x c d
        // 此时我们判断插入的位置，如果e2+1位置有值，说明是在中间或前面插入，否则就是在后面插入
        // 如果是在中间或者前面插入则使用insertBefore，如果是在后面插入则使用appendChild
        const insertEl = c2[e2 + 1]?.el
        const anchor =  !!insertEl ? insertEl : null;
        console.log(anchor)
        while(i <= e2) {
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if(i > e2) { // 删除
      if(i <= e1) {
        // 删除多余节点
        while(i <= e1) {
          unmount(c1[i])
          i++;
        }
      }
    } else {
      // 如果对比完后，两边都有剩余节点，且剩余的节点可能需要复用，则进行复杂diff逻辑处理
      //
      // 例如a b c d e f g -> a b e c d h f g
      // 对比完后, i=2, e1=4, e2=5
      // 左边剩余 c d e，右边剩余 e c d h
      // 此时cde均需要复用更新，而h需要新增
      
      let
        s1 = i,
        s2 = i;
      
      // 需要插入的数量
      const toBePatched = e2 - s2 + 1;
      
      // diff算法使用
      // 新元素对应老元素的位置，不存在默认0
      const  newIndexToOldMapIndex = new Array(toBePatched).fill(0);
      
      // 构建新节点映射表
      const keyToNewIndexMap = new Map();
      for(let i = s2; i <= e2; i++) {
        const vnode = c2[i];
        keyToNewIndexMap.set(vnode.key, i);
      }
      
      // 遍历老的，如果不存在则删除，如果存在则去更新dom属性
      for(let i = s1; i <= e1; i++) {
        const vnode = c1[i];
        const newIndex = keyToNewIndexMap.get(vnode.key);
        // 如果老元素在新列表中不存在，则删除该元素即可
        if(newIndex === undefined) {
          unmount(vnode);
        }
        else {
          // 存在则说明需要复用该元素，记录该元素在老节点的位置+1（因为0表示不存在）
          newIndexToOldMapIndex[newIndex - s1] = i + 1 ;
          // 如果存在，则更新元素
          patch(vnode, c2[newIndex], el);
        }
      }
      
      // 更新完元素后，再去调整元素顺序
      // 获取不需要移动的最长递增子序列
      const increasingNewIndexSequence = getSequence(newIndexToOldMapIndex);
      let j = increasingNewIndexSequence.length -1;

      // 遍历新的虚拟节点的不同部分（从后往前），如果有，说明需要移动
      for(let i = toBePatched - 1; i>=0; i--) {
        const nextIndex = s2 + i;
        const nextChild = c2[nextIndex];
        const anchorVNode = c2[nextIndex + 1];
        const anchor = anchorVNode?.el || null;
        // 如果虚拟节点上el没有真实dom，说明没有，需要创建并挂在
        if(!nextChild.el) {
          patch(null, nextChild, el, anchor);
        }
        // 否则移动位置
        else {
          // 如果元素在最长递增子序列中则无需移动，否则移动
          if(i !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, el, anchor);
          } else {
            j--;
          }
        }
      }
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
          patchKeyedChildren(c1, c2, el);
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
   * @param anchor - 锚点元素
   */
  const patch = (n1, n2, container, anchor = null) => {
    if(n1 === n2) {
      return;
    }

    // 渲染过一次，需要查看上一次的节点和这次的节点是否相同，如果不同就卸载重新创建挂载
    if(n1 && !isSameVNode(n1, n2)) {
      unmount(n1);
      // n1为null时，processElement中会重新执行mountElement去创建挂载
      n1 = null;
    }

    processElement(n1, n2, container, anchor);
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