
export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export enum DirtyLevels {
  // 脏值，重新运行计算属性
  Dirty = 4,

  // 不脏，使用上一次的计算结果
  NoDirty = 0
}