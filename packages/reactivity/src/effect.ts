


export function effect(fn, options?) {

  // 如果fn依赖的数据发生了变换，则需要重新执行fn
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  // 默认需要执行一次fn
  _effect.run();

  // 如果用户传入了options，则进行合并
  if(options) {
    Object.assign(_effect, options);
  }

  // 将run方法绑定到_effect实例上
  const runner = _effect.run.bind(_effect);

  // 再给runner挂载一个effect属性，指向当前的_effect实例
  runner.effect = _effect;

  // 将runner方法返回出去，方便用户手动调用
  return runner;
}

function preCleanEffect(effect) {
  effect._depsLength = 0;

  effect._trackId++;
}

function cleanDepEffect(dep, effect) {
  dep.delete(effect);
  if(dep.size === 0) {
    dep.cleanup();
  }
}

function postCleanEffect(effect) {
  const usefulLen = effect._depsLength;
  const totalLen = effect.deps.length;

  // 如果当前收集下来的依赖数量比之前的依赖数量多或者相等，则不需要清理
  if(usefulLen >= totalLen) {
    return;
  }

  // 多余的依赖需要清理掉
  for(let i = usefulLen; i < totalLen; i++) {
    const dep = effect.deps[i];
    cleanDepEffect(dep, effect);
  }
  effect.deps.length = usefulLen;
}

export let activeEffect;

class ReactiveEffect {

  // 标记当前effect是否需要响应式
  public active = true;

  // 记录当前effect执行了几次
  _trackId = 0;

  deps = [];
  _depsLength = 0;

  _running = 0

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

      this._running++;

      // 依赖手机：执行fn方法，触发对象的get操作进行依赖收集
      return this.fn();
    } finally {
      this._running--;
      // 清理多余的依赖, 当run重新运行重新收集依赖, 可能依赖会变少
      // 例如: fn中使用了如下代码: person.flag ? person.name + ' ' + person.age: person.name
      // 如果flag由true变为false, 则age不再是依赖, 需要清理掉
      postCleanEffect(this);

      activeEffect = lastEffect;
    }
  }
}

export function trackEffect(effect, deps) {
  // 首次进来时deps中还没有东西
  // effect.run重新运行时，effect._trackId会+1，表示这是一次新的收集，但是如果运行的方法多次访问同一个属性，trackId不会有变换
  // 也就是说trackId表示的是某次收集过程，一个过程可能多次访问同一个属性即effect.fn中的运行可能会多次访问同一个属性
  if(deps.get(effect) !== effect._trackId) {
    deps.set(effect, effect._trackId);

    // 当effect.run重新运行会走到preCleanEffect方法将_depsLength置为0
    // effect.fn不会改变,则依赖收集的顺序不会改变,即fn中依赖哪些属性的顺序不会变化, 除非遇到条件判断等动态依赖
    let oldDep = effect.deps[effect._depsLength];

    // 如果依赖不改变,即fn中访问的属性不变,则deps仍是原来属性的deps
    // 如果改变, oldDep !== deps, 则说明fn方法中遇到了条件判断
    // 例如person.flag ? person.name : person.age
    // 如果flag由true变为false,则依赖顺序为 [flag对应的deps, name对应的deps] 变为 [flag对应的deps, age对应的deps]
    if(oldDep !== deps) {
      if(oldDep) {
        // 有老的, 需要删除掉老的里面的依赖,注意oldDep是一个map对象,存放某个对象的某个属性的所以依赖,我们只需要删除当前effect即可
        cleanDepEffect(oldDep, effect)
      }
      // 新的覆盖
      effect.deps[effect._depsLength++] = deps;
    } else {
      // 依赖顺序无变化, 继续使用老的deps, ++跳过当前
      effect._depsLength++;
    }

  }
}

export function triggerEffects(deps) {
  for(const effect of deps.keys()) {
    if(effect.scheduler) {

      // 为0说明没有执行，则执行，不为零
      if(!effect._running) {
        effect.scheduler();
      }
    }
  }

}