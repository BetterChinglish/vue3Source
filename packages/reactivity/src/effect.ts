


export function effect(fn, options?) {

  // 如果fn依赖的数据发生了变换，则需要重新执行fn
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  // 默认需要执行一次fn
  _effect.run();
}


export let activeEffect;
class ReactiveEffect {
  public active = true;
  constructor(public fn, public scheduler?) {

  }

  run() {

    if(!this.active) {
      return this.fn();
    }

    // 嵌套effect处理
    let lastEffect = activeEffect;

    try {
      activeEffect = this;

      return this.fn();
    } finally {
      activeEffect = lastEffect;
    }
  }
}