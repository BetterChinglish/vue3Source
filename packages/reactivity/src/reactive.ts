import {isObject} from "@vue/shared";


export function reactive(target) {
  return createReactiveObject(target);
}



const mutableHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    if(key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }

  },
  set(target, key, value, receiver) {

      return true;
  }
}

enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

const reactiveMap = new WeakMap();


function createReactiveObject(target) {

  if(!isObject(target)) {
    return target;
  }

  // 已经有代理了, 防止重复代理
  if(reactiveMap.has(target)) {
    return reactiveMap.get(target);
  }

  // 防止代理一个被vue reactive包装过的proxy对象
  // 这里并非在代理对象上新增了一个属性，而是拦截了一个属性的get操作
  if(target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }

  const proxyResult = new Proxy(target, mutableHandlers);

  reactiveMap.set(target, proxyResult);

  return proxyResult;
}

