// 对节点元素的增删改查

// const {
//     insert: hostInsert,
//     remove: hostRemove,
//     patchProp: hostPatchProp,
//     createElement: hostCreateElement,
//     createText: hostCreateText,
//     createComment: hostCreateComment,
//     setText: hostSetText,
//     setElementText: hostSetElementText,
//     parentNode: hostParentNode,
//     nextSibling: hostNextSibling,
//     setScopeId: hostSetScopeId = NOOP,
//     insertStaticContent: hostInsertStaticContent,
//   } = options

export const nodeOps = {
  // anchor为null时等价于appendChild
  insert(el, parent, anchor) {
    parent.insertBefore(el, anchor || null);
  },
  remove(el) {
    const parent = el.parentNode;
    if (parent) {
      parent.removeChild(el);
    }
  },
  createElement(type) {
    return document.createElement(type);
  },
  createText(text) {
    return document.createTextNode(text);
  },
  createComment(text) {
    return document.createComment(text);
  },
  setText(node, text) {
    node.nodeValue = text;
  },
  setElementText(el, text) {
    el.textContent = text;
  },
  parentNode(node) {
    return node.parentNode;
  },
  nextSibling(node) {
    return node.nextSibling;
  }
}