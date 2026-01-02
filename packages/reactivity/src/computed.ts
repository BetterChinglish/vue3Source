import { isFunction } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "@vue/reactivity";


// 计算属性依赖的值发生改变会触发set，set会触发计算属性的effect的scheduler，从而触发计算属性依赖的effect更新
class ComputedRefImpl {
  // 存储计算值
  public _value;

  public effect;

  public dep;

  constructor(getter, public setter) {
    // 注意computed中依赖的数据的属性的get会与此effect关联
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      () => {
        // 当依赖发生改变，触发此scheduler，此时需要重新触发计算属性收集的effect更新，注意要将计算属性标记为脏
        triggerRefValue(this);
      }
    )
  }

  get value() {
    // 如果dirty则执行run获取新值
    if(this.effect.dirty) {
      this._value = this.effect.run();
    }
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    this.setter(newValue);
  }
}

export function computed(getterOrOptions) {

  const onlyGetter = isFunction(getterOrOptions);

  let getter, setter;

  // 如果是个方法，则将此方法作为getter，setter默认空方法
  if(onlyGetter) {
    getter = getterOrOptions;
    setter = () => {};
  }
  // 否则传入的是一个有get、set方法的对象，则分别取出
  else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  console.log(getter, setter);


  // 计算属性ref
  return new ComputedRefImpl(getter, setter);
}


