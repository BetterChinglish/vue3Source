
const veiKey = Symbol('_vei');

function createInvoker(fn) {
  const invoker = (e) => {
    invoker.value(e);
  }
  invoker.value = fn;
  return invoker;
}

// 有一个绑定优化，设置了一个指针指向要绑定的函数，绑定的函数其实
export function patchEvent(el, name, nextValue) {

  // vei = vue event invoker
  const invokers = el[veiKey] || (el[veiKey] = {});
  // onClick -> click
  const eventName = name.slice(2).toLowerCase();
  // 先获取已有的 invoker
  const exisitingInvoker =  invokers[eventName];


  if(nextValue && exisitingInvoker) {
    return exisitingInvoker.value = nextValue;
  } else {
    // 有新值，没有旧值，则创建invoker并赋值
    if(nextValue) {
      // 添加事件
      const invoker = invokers[eventName] = createInvoker(nextValue);
      el.addEventListener(eventName, invoker);
    }
    // 有旧值，没有新值，则删除事件
    else if(exisitingInvoker) {
      // 删除事件
      el.removeEventListener(eventName, exisitingInvoker);
      // 清空
      invokers[eventName] = undefined;
    }
    // 新旧值都没有，则不处理
  }
}