
// ref shallowRef
import { activeEffect, createDep, toReactive, trackEffect, triggerEffects } from "@vue/reactivity";

export function ref(value) {
  return createRef(value);
}

function createRef(value) {
  return new RefImpl(value);
}

class RefImpl {
  // 增加ref标识
  public __v_isRef = true;

  // 保存ref值
  public _value;

  // 收集对应的effect
  public dep;

  constructor(public rawValue) {
    // 对象则使用reactive包裹，字面量值则不变
    this._value = toReactive(rawValue);
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    if(newValue !== this.rawValue) {
      this.rawValue = newValue;
      this._value = toReactive(newValue);
      triggerRefValue(this);
    }
  }
}

function trackRefValue(ref: RefImpl) {
  if(activeEffect) {
    trackEffect(
      activeEffect,
      ref.dep = createDep(
        () => ref.dep = undefined,
        'undefined'
      )
    )
  }
}

function triggerRefValue(ref: RefImpl) {
  const dep = ref.dep;
  if(dep) {
    triggerEffects(dep);
  }
}

