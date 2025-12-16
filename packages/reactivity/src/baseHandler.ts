export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    if(key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }

    // 响应属性与refect映射
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {

    // 找到属性对应的副作用函数并执行

    Reflect.set(target, key, value, receiver);
    return true;
  }
}
// 使用Reflect避免this指向问题，具体分析可见：https://github.com/BetterChinglish/vue3Source/blob/main/read/01%20%E5%93%8D%E5%BA%94%E7%B3%BB%E7%BB%9F/summary.md#5-js%E5%AF%B9%E8%B1%A1%E4%B8%8Eproxy%E7%9A%84%E5%B7%A5%E4%BD%9C%E5%8E%9F%E7%90%86

