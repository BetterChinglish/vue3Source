
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

export function trackRefValue(ref) {
  if(activeEffect) {
    if(!ref.dep) {
      ref.dep = createDep(
        () => ref.dep = undefined,
        'undefined'
      )
    }
    trackEffect(
      activeEffect,
      ref.dep
    )
  }
}

export function triggerRefValue(ref) {
  const dep = ref.dep;
  if(dep) {
    triggerEffects(dep);
  }
}

class ObjectRefImpl {
  public __v_isRef = true;
  constructor(public _object, public _key) {

  }

  get value() {
    return this._object[this._key];
  }

  set value(newVal) {
    this._object[this._key] = newVal;
  }
}

export function toRef(obj, key) {
  return new ObjectRefImpl(obj, key);
}

export function toRefs(obj) {
  const res = {};
  for(const key in obj) {
    res[key] = toRef(obj, key);
  }
  return res;
}

export function proxyRefs(objectWithRef) {
  return new Proxy(objectWithRef, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver);
      return res.__v_isRef ? res.value : res;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      if(oldValue.__v_isRef) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    }
  })
}


export function isRef(data) {
  return !!(data && data.__v_isRef);
}