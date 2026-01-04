import { isReactive, isRef, ReactiveEffect } from "@vue/reactivity";
import { isFunction, isObject } from "@vue/shared";


export function watch(source, cb, options = {} as any) {

  return doWatch(source, cb, options);
}


export function watchEffect(source, options = {}) {
  return doWatch(source, null, options);
}

// 仅触发get以收集依赖
function traverse(source, depth, currentDepth = 0, seen = new Set()) {
  if(!isObject(source)) {
    return source;
  }

  // 非deep则判断是否达到指定深度, 即1
  if(depth) {
    if(currentDepth >= depth ) {
      return source
    }

    currentDepth++;
  }

  // 避免循环引用死循环
  if(seen.has(source)) {
    return source;
  }

  // 默认deep则递归遍历
  for(let key in source) {
    traverse(source[key], depth, currentDepth, seen);
  }

  return source;
}

function doWatch(source, cb, options) {
  const { deep = true, immediate } = options;
  // 如果deep则深度收集, 非deep只收集一层
  const reactiveGetter = (source) => {
    return traverse(source, deep === false ? 1 : undefined)
  }
  let getter;
  if(isReactive(source)) {
    // 使用reactiveEffect默认执行一次getter以收集依赖
    getter = () => reactiveGetter(source);
  }
  // ref使用方法包装直接取值触发get
  else if(isRef(source)) {
    getter = () => source.value;
  }
  else if(isFunction(source)) {
    getter = source;
  }

  let oldValue;

  // 当watch的state发生改变会触发ReactiveEffect的schduler也就是这个job
  const job = () => {
    if(cb) {
      // effect.run会拿到state的新值
      const newValue = effect.run();
      // 传给watch中用户设置的callback并执行该callback
      cb(newValue, oldValue);
      // 同时下一次的老值就是这一次的新值
      oldValue = newValue;
    }
    // watchEffect没有cb，直接执行effect.run触发副作用方法
    else {
      effect.run();
    }
  }

  const effect = new ReactiveEffect(getter, job)

  if(cb) {
    if(immediate) {
      job();
    } else {
      oldValue = effect.run();
    }
  } else {
    // watchEffect
    effect.run();
  }
}