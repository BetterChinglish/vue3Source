


export function effect(fn, options?) {

  // 如果fn依赖的数据发生了变换，则需要重新执行fn
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  // 默认需要执行一次fn
  _effect.run();
}

function preCleanEffect(effect) {
  effect._depsLength = 0;

  effect._trackId++;
}

export let activeEffect;

class ReactiveEffect {

  // 标记当前effect是否需要响应式
  public active = true;

  // 记录当前effect执行了几次
  _trackId = 0;

  deps = [];
  _depsLength = 0;

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

      // 收集依赖前将上一次的清空
      preCleanEffect(this);

      // 依赖手机：执行fn方法，触发对象的get操作进行依赖收集
      return this.fn();
    } finally {
      activeEffect = lastEffect;
    }
  }
}

export function trackEffect(effect, deps) {
  // 首次进来时deps中还没有东西
  console.log(effect._trackId, deps.get(effect));
  if(deps.get(effect) !== effect._trackId) {
    deps.set(effect, effect._trackId);

    // let oldDep = effect.deps[effect._depsLength];
    //
    // if(oldDep !== deps) {
    //   if(oldDep) {
    //
    //   }
    //   effect.deps[effect._depsLength++] = deps;
    // }

  }
  // dep.set(effect, effect._trackId);
  // effect.deps[effect._depsLength++] = dep;
}

export function triggerEffects(deps) {
  for(const effect of deps.keys()) {
    if(effect.scheduler) {
      effect.scheduler();
    }
  }

}