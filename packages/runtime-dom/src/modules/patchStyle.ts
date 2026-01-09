export function patchStyle(el, prevValue, nextValue) {
  const style = el.style;

  // 新样式全部直接应用
  for(let key in nextValue) {
    style[key] = nextValue[key];
  }
  if(prevValue) {
    for(let key in prevValue) {
      // 老样式中有，新样式中没有，删除
      if(nextValue[key] === undefined || nextValue[key] === undefined) {
        style[key] = null;
      }
    }
  }
}