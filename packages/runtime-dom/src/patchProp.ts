// 节点的属性的操作
import { patchClass } from "./modules/patchClass";
import { patchStyle } from "./modules/patchStyle";
import { patchEvent } from "./modules/patchEvent";
import { patchAttr } from "./modules/patchAttr";

export default function patchProp(el, key, prevValue, nextValue) {
  if(key === 'class') {
    return patchClass(el, nextValue)
  } else if(key === 'style') {
    return patchStyle(el, prevValue, nextValue);
  } else if(/^on[A-Z]/.test(key)) {
    return patchEvent(el, key, nextValue);
  } else {
    return patchAttr(el, key, nextValue);
  }
}