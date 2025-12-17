import { activeEffect, trackEffect, triggerEffects } from "./effect";


// key是对象，value是一个map，这个map的key是对象的属性，value还是一个map，存放该属性的副作用的合集
const targetMap = new WeakMap();

// 为某个对象的某个属性创建一个map
export const createDep = (cleanup, key) => {
  const deps = new Map() as any;
  // 在map上挂一个方法cleanup用于删除当前key对应的副作用
  deps.cleanup = cleanup;
  // 当前map为哪个属性服务
  deps.key = key;
  return deps;
}

export function track(target, key) {

  if(activeEffect) {
    let depsMap = targetMap.get(target);

    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }

    let deps = depsMap.get(key);
    if(!deps) {
      depsMap.set(
        key,
        deps = createDep(() => {
          depsMap.delete(key);
        }, key)
      );
    }

    trackEffect(activeEffect, deps);

    console.log(targetMap)
  }
}

export function trigger(target, key, value, oldValue) {

  // 获取对象的全部属性依赖map
  const depsMap = targetMap.get(target);

  // 没有
  if(!depsMap) {
    return;
  }

  // 属性的依赖集合
  const deps = depsMap.get(key);


  if(deps) {
    triggerEffects(deps)
  }


  console.log(target, key, targetMap)
}











