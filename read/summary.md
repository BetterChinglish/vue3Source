
# 4 响应式系统

## 4.1 基本实现
```js
const obj = {
  text: 'test'
}

function effect() {
  document.body.innerText = obj.text;
}
```

响应式系统其实就是读取数据时拦截添加响应，当数据发生修改时触发添加的响应
* effect执行时，会触发obj.text的**读取**操作
* 当修改obj.text时, 会触发obj.text的**设置**操作

拦截数据的读取操作与设置操作, 即可实现一个响应式数据的基本轮廓
```js
// 原始数据
const originalData = {
  text: 'test'
}

// 副作用函数
function effect() {
  document.body.innerText = originalData.text;
}

// 存储副作用函数
const bucket = new Set();

const proxyObj = new Proxy(originalData, {
  get(target, key) {
    bucket.add(effect);
    return target(key);
  },
  set(target, key, newVal) {
    // 触发副作用函数重新执行
    bucket.forEach(cb => cb())
    // set实现
    target[key] = newVal;
    // 返回true标识操作成功
    return true;
  }
})
```

## 4.2 完善响应式系统

4.1中基本实现了一个响应式系统的最基本轮廓，但是他还有很大的改进
* 副作用函数硬编码了即直接写死，我们要实现捕获副作用函数，即便其是一个匿名函数

```js
// 用于存放副作用函数
let activeEffect;

// 实现一个方法捕获副作用函数
function effect(fn) {
  activeEffect = fn;
  fn();
}

// 原始数据
const originalData = {
  text: 'test'
}

// 使用effect
effect(() => {
  document.body.innerText = originalData.text;
})
```

这样这个匿名方法就被存到了activeEffect中
```js
() => {
  document.body.innerText = originalData.text;
}
```

我们再实现代理
```js
// 原始数据
const originalData = {
  text: 'test'
}

// 存储副作用函数
const bucket = new Set();

const proxyObj = new Proxy(originalData, {
  get(target, key) {
    if(activeEffect) {
      // 收集副作用函数
      bucket.add(activeEffect);
    }
    return target[key];
  },
  set(target, key, newVal) {
    // 触发副作用函数重新执行
    bucket.forEach(cb => cb())
    // set实现
    target[key] = newVal;
    // 返回true标识操作成功
    return true;
  }
})
```

完整代码
```js
// 用于存放副作用函数
let activeEffect;

// 实现一个方法捕获副作用函数
function effect(fn) {
  activeEffect = fn;
  fn();
}

// 原始数据
const originalData = {
  text: 'test'
}

// 存储副作用函数
const bucket = new Set();

const proxyObj = new Proxy(originalData, {
  get(target, key) {
    if(activeEffect) {
      // 收集副作用函数
      bucket.add(activeEffect);
    }
    return target[key];
  },
  set(target, key, newVal) {
    // 触发副作用函数重新执行
    bucket.forEach(cb => cb())
    // set实现
    target[key] = newVal;
    // 返回true标识操作成功
    return true;
  }
})

// 使用effect
effect(() => {
  document.body.innerText = proxyObj.text;
})
```

----

到这解决了副作用函数的捕获问题

但是如上代码所示，目前的系统对originalData不同属性的副作用方法都收集到了一个set当中，而实际上我们应该精确到每个属性
```js
const originalData = {
  textA: 'test A',
  textB: 'test B'
}

// 1
effect(() => {
  originalData.textA;
})

// 2
effect(() => {
  originalData.textB;
})

// 当修改textB时，应该只触发2的副作用而不触发1的副作用
originalData.textB = 'test';
```

我们对于任何一个属性，都应该单独用一个Set对象存储他的副作用方法

此时我们可以考虑使用Map对象，其key与value的含义如下
* key为originalData的某个属性的属性名
* value为一个set，存放副作用方法

修改后的代码如下：

```js
// 用于存放副作用函数
let activeEffect;

// 实现一个方法捕获副作用函数
function effect(fn) {
  activeEffect = fn;
  fn();
}

// 原始数据
const originalData = {
  textA: 'test A',
  textB: 'test B'
}

// 存储每个字段的副作用函数
const dependsMap = new Map();

const proxyObj = new Proxy(originalData, {
  get(target, key) {
    // 找到key属性对应的副作用set
    let dependsSet = dependsMap.get(key);
    // 如果没有，则创建
    if(!dependsSet) {
      dependsMap.set(key, dependsSet = new Set())
    }
    // 添加副作用
    dependsSet.add(activeEffect);
    
    return target[key];
  },
  set(target, key, newVal) {
    // set实现
    target[key] = newVal;
    // 取出该字段存储副作用函数的set
    const dependsSet = dependsMap.get(key);
    // 没有则直接返回
    if(!dependsSet) {
      return;
    }
    dependsSet && dependsSet.forEach(fn => fn());
  }
})

// 使用effect
effect(() => {
  document.body.innerText = proxyObj.text;
})
```

----

每个对象都有一个Map对象，存放这个对象的每个属性的副作用函数，
我们可以使用一个WeakMap对象，将所有需要代理的对象的Map对象存放下来，这个WeakMap对象的结构如下

> WeakMap
> > key: 被代理的对象
> 
>> value: Map
> > > key: 被代理的对象的属性
> >
> > > value: Set对象，存放被代理的对象的属性的所有副作用函数

修改后的代码如下：
```js
// 用于存放副作用函数
let activeEffect;

// 实现一个方法捕获副作用函数
function effect(fn) {
  activeEffect = fn;
  fn();
}

// 原始数据
const originalData = {
  textA: 'test A',
  textB: 'test B'
}

// 存储全局某个对象的某个属性的副作用函数
const globalDependsMap = new WeakMap();

const proxyObj = new Proxy(originalData, {
  get(target, key) {
    // 找到当前对象target对应的map
    let dependsMap = globalDependsMap.get(target);
    // 没有则为该对象创建
    if(!dependsMap) {
      globalDependsMap.set(target, (dependsMap = new Map()));
    }
    // 找到key属性对应的副作用set
    let dependsSet = dependsMap.get(key);
    // 没有则为该属性创建
    if(!dependsSet) {
      dependsMap.set(key, dependsSet = new Set())
    }
    // 添加副作用
    dependsSet.add(activeEffect);
    
    return target[key];
  },
  set(target, key, newVal) {
    // set实现
    target[key] = newVal;
    
    // 找到该属性对应的map
    let dependsMap = globalDependsMap.get(target);
    // 没有则直接返回
    if(!dependsMap) {
      return;
    }
    
    // 取出该字段存储副作用函数的set
    const dependsSet = dependsMap.get(key);
    // 没有则直接返回
    if(!dependsSet) {
      return;
    }
    dependsSet && dependsSet.forEach(fn => fn());
  }
})

// 使用effect
effect(() => {
  document.body.innerText = proxyObj.textA;
})
```

----

为什么使用WeakMap？因为其key是弱引用，不会影响垃圾回收

```js
const m = new Map();
const wm = new WeakMap();

(function() {
  const world = 'hello world';
  m.set('world', say);
  
  const sayWords = {
    text: 'hello javascript'
  };
  wm.set(sayWords, '那咋了')
})()

// 执行完后，打开wm会发现啥也没
console.log(m, wm)
// 如果还是有可能垃圾回收还没触发，可以用下面的方法
/*
setTimeout(() => {
  console.log(m, wm)
}, 3000)
*/

```

WeakMap对象的key只能是对象, 而Map的key可以是任何值。

具体差异可以去查mdn，这里使用WeakMap的主要原因就是不影响垃圾回收，
如果使用Map那么其他方法（对应到vue就是相当于某些unmounted的组件）中的一些被代理的对象将永远无法被垃圾回收

----

这里讲讲一些代码分割与封装

例如上面的对orginalData创建Proxy对象的过程，这里可以封装成通用方法，

对于get中追踪副作用函数的过程可以单独写个方法，同理set中对副作用方法的触发也可以单独写个方法
```js
// 用于存放副作用函数
let activeEffect;

// 实现一个方法捕获副作用函数
function effect(fn) {
  activeEffect = fn;
  fn();
}

// 将对象转为代理对象
function toProxy(obj) {
  return new Proxy(obj, {
    get(target, key) {
      // 追踪副作用函数
      track(target, key);
      // get实现
      return target[key];
    },
    set(target, key, newVal) {
      // set实现
      target[key] = newVal;
      // 副作用函数的触发
      trigger(target, key)
    }
  })
}
// get中追踪副作用方法
function track(target, key) {
  // 没有activeEffect直接return
  if(!activeEffect) {
    return;
  }
  // 找到当前对象target对应的map
  let dependsMap = globalDependsMap.get(target);
  // 没有则为该对象创建
  if(!dependsMap) {
    globalDependsMap.set(target, (dependsMap = new Map()));
  }
  // 找到key属性对应的副作用set
  let dependsSet = dependsMap.get(key);
  // 没有则为该属性创建
  if(!dependsSet) {
    dependsMap.set(key, dependsSet = new Set())
  }
  // 添加副作用
  dependsSet.add(activeEffect);
}
// set中触发副作用方法
function trigger(target, key) {
  // 找到该属性对应的map
  let dependsMap = globalDependsMap.get(target);
  // 没有则直接返回
  if(!dependsMap) {
    return;
  }
  
  // 取出该字段存储副作用函数的set
  const dependsSet = dependsMap.get(key);
  // 没有则直接返回
  if(!dependsSet) {
    return;
  }
  dependsSet && dependsSet.forEach(fn => fn());
}

/* 以下是测试代码 */

// 原始数据
const originalData = {
  textA: 'test A',
  textB: 'test B'
}

// 存储全局某个对象的某个属性的副作用函数
const globalDependsMap = new WeakMap();

// 代理对象
const proxyObj = toProxy(originalData);

// 使用effect
effect(() => {
  document.body.innerText = proxyObj.textA;
})
```

到这里，代码结构略显优雅，后续针对某个方法的代码优化可能只写这一个方法，在上述代码中直接替换即可，
这里也附上最终完整用的测试代码（其实就是直接塞到html里）

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport"
        content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Document</title>
</head>
<body>
<script>
  /* 响应式原理代码区域 */
  
  // 用于存放副作用函数
  let activeEffect;

  // 实现一个方法捕获副作用函数
  function effect(fn) {
    activeEffect = fn;
    fn();
  }

  // 存储全局某个对象的某个属性的副作用函数
  const globalDependsMap = new WeakMap();
  // 将对象转为代理对象
  function toProxy(obj) {
    return new Proxy(obj, {
      get(target, key) {
        // 追踪副作用函数
        track(target, key);
        // get实现
        return target[key];
      },
      set(target, key, newVal) {
        // set实现
        target[key] = newVal;
        // 副作用函数的触发
        trigger(target, key)
      }
    })
  }
  // get中追踪副作用方法
  function track(target, key) {
    // 没有activeEffect直接return
    if(!activeEffect) {
      return;
    }
    // 找到当前对象target对应的map
    let dependsMap = globalDependsMap.get(target);
    // 没有则为该对象创建
    if(!dependsMap) {
      globalDependsMap.set(target, (dependsMap = new Map()));
    }
    // 找到key属性对应的副作用set
    let dependsSet = dependsMap.get(key);
    // 没有则为该属性创建
    if(!dependsSet) {
      dependsMap.set(key, dependsSet = new Set())
    }
    // 添加副作用
    dependsSet.add(activeEffect);
  }
  // set中触发副作用方法
  function trigger(target, key) {
    // 找到该属性对应的map
    let dependsMap = globalDependsMap.get(target);
    // 没有则直接返回
    if(!dependsMap) {
      return;
    }

    // 取出该字段存储副作用函数的set
    const dependsSet = dependsMap.get(key);
    // 没有则直接返回
    if(!dependsSet) {
      return;
    }
    dependsSet && dependsSet.forEach(fn => fn());
  }

  /* 测试相关代码区域 */

  // 响应式数据测试
  function reactiveSystemTest() {
    // 原始数据
    const originalData = {
      textA: 'test A',
      textB: 'test B'
    }

    // 代理对象
    const proxyObj = toProxy(originalData);

    let effectCount = 0
    // 使用effect
    effect(() => {
      // 副作用方法执行
      effectCount++ === 0 ? console.log('originalData.textA的副作用方法初始化辣！') : console.log('originalData.textA的副作用方法又执行辣！');
      document.body.innerText = proxyObj.textA;
    })

    setTimeout(() => {
      // 修改数据，查看页面变化
      proxyObj.textA = 'hahaha';
      console.log('change', originalData);
    }, 1500)

    setTimeout(() => {
      // 修改textB，查看textA的副作用方法是否执行
      proxyObj.textB = 'bababa';
      console.log('change', originalData);
    }, 3000)
  }

  // WeakMap与Map的垃圾回收测试
  function weakMapAndMapGarbageCollectionTest() {
    const m = new Map();
    const wm = new WeakMap();

    (function() {
      const world = 'hello world';
      m.set('world', world);

      const sayWords = {
        text: 'hello javascript'
      };
      wm.set(sayWords, '那咋了')
    })()

    setTimeout(() => {
      console.log(m, wm)
    }, 3000)
  }

  /* 测试代码执行区域 */
  try{
    reactiveSystemTest();
    // weakMapAndMapGarbageCollectionTest();
  } catch (e) {
    console.log(e)
  }
</script>
</body>
</html>
```

由于要做笔记的示例代码，单文件编写方便点，燃尽了qwq

## 4.3 分支切换

问题来咯, 新增测试代码reactiveSystemTest4BranchSwitch，测试代码执行区域修改为该方法的执行
```js
function reactiveSystemTest4BranchSwitch() {
  // 原始数据
  const originalData = {
    ok: true,
    textA: 'test A',
  }
  
  // 代理对象
  const proxyObj = toProxy(originalData);
  
  // 新增计数器判断副作用方法是初始化还是再次执行
  let effectCount = 0
  // 使用effect
  effect(() => {
    // 副作用方法执行
    effectCount++ === 0 ? console.log('originalData.textA的副作用方法初始化辣！') : console.log('originalData.textA的副作用方法又执行辣！');
    document.body.innerText = proxyObj.ok ? proxyObj.textA : '嘿嘿啥也不是';
  })
  
  // 1
  setTimeout(() => {
    // 修改数据，查看页面变化
    proxyObj.textA = 'hahaha';
    console.log('after change', originalData);
  }, 1500)
  // 2
  setTimeout(() => {
    // 修改数据，查看页面变化
    proxyObj.ok = false;
    console.log('after change', originalData);
  }, 3000)
  // 3
  setTimeout(() => {
    // 修改数据，查看页面变化
    proxyObj.textA = 'balabala';
    console.log('after change', originalData);
  }, 3000)
}

/* 测试代码执行 */
try{
  // reactiveSystemTest();
  // weakMapAndMapGarbageCollectionTest();
  
  reactiveSystemTest4BranchSwitch();
} catch (e) {
  console.log(e)
}
```

执行结果如下
```
originalData.textA的副作用方法初始化辣！

originalData.textA的副作用方法又执行辣！
after change {ok: true, textA: 'hahaha'}

originalData.textA的副作用方法又执行辣！
after change {ok: false, textA: 'hahaha'}

originalData.textA的副作用方法又执行辣！
after change {ok: false, textA: 'balabala'}
```

在第一个settimeout中,我们修改了textA的值, 副作用方法执行,这没问题

在第二个settimeout中,我们修改了ok为false,副作用方法也执行,这也没问题

在第三个settimeout中,我们再次修改textA, 但是副作用方法 此时与textA无关, 
因为ok为false，textA永远不会被访问，所以此时不应该再次执行副作用函数，但是还是执行了
```js
document.body.innerText = proxyObj.ok ? proxyObj.textA : '嘿嘿啥也不是';
```

如何解决呢？

其实我们每次执行前将这个属性的依赖绑定清除掉，并在执行副作用时重新触发get中的track重新收集依赖

考虑第三次settimeout，当修改textA时，触发set，set中触发trigger，执行对应的副作用函数
在执行副作用函数之前，我们先将这个要执行的副作用函数给清除掉，然后再执行，执行时会再去重新收集依赖

我们拿下面这段例子来说明

```js
  // 新增计数器判断副作用方法是初始化还是再次执行
  let effectCount = 0
  const fn1 = () => {
    // 副作用方法执行
    effectCount++ === 0 ? console.log('originalData.textA的副作用方法初始化辣！') : console.log('originalData.textA的副作用方法又执行辣！');
    document.body.innerText = proxyObj.ok ? proxyObj.textA : '嘿嘿啥也不是';
  }
  // 使用effect
  effect(fn1)

  // 2
  setTimeout(() => {
    // 修改数据，查看页面变化
    proxyObj.ok = false;
    console.log('after change', originalData);
  }, 3000)
  
```

在上述代码2处的settimeout中修改ok, 则ok字段应该对应有一个set, 其中存放着使用过ok字段的所有副作用方法, 当然也包含fn1这个副作用方法, 
set中的trigger执行, 也会触发这个fn1方法执行,
那么在fn1执行之前, 我们要找到所有存放过fn1这个副作用方法的set, 并将这些set中的这个fn1方法全部删除

在这个例子中, 存放过fn1副作用方法的set有两个, 分别是ok字段对应的set与textA字段对应的set, 
则我们会将这两个set中的fn1删除, 注意这两个set中还可能存放其他的副作用方法

在触发fn1前删除, 删除后再次触发fn1执行, 此时fn1中的代码(**document.body.innerText = proxyObj.ok ? proxyObj.textA : '嘿嘿啥也不是';**)
又会去访问ok字段, 则触发ok字段的get与get中的track方法进行依赖收集, 但是注意, ok的get方法此时应该是返回的false, 因为刚刚settimeout中将其修改为false了,
那么这个三元表达式不会访问proxyObj.textA, 则textA对应的set中不会再有fn1, 那么再在前面代码示例中第三个settimeout修改textA, 不会再触发fn1

```js
  // 新增计数器判断副作用方法是初始化还是再次执行
  let effectCount = 0

  const fn1 = () => {
    // 副作用方法执行
    effectCount++ === 0 ? console.log('originalData.textA的副作用方法初始化辣！') : console.log('originalData.textA的副作用方法又执行辣！');
    document.body.innerText = proxyObj.ok ? proxyObj.textA : '嘿嘿啥也不是';
  }
  
  // 使用effect
  effect(fn1)
  
  // 1
  setTimeout(() => {
    // 修改数据，查看页面变化
    proxyObj.textA = 'hahaha';
    console.log('after change', originalData);
  }, 1500)
  // 2
  setTimeout(() => {
    // 修改数据，查看页面变化
    proxyObj.ok = false;
    console.log('after change', originalData);
  }, 3000)
  // 3
  setTimeout(() => {
    // 修改数据，查看页面变化
    proxyObj.textA = 'balabala';
    console.log('after change', originalData);
  }, 3000)
```

到这里, 原理我们说明白了, 那么如何去做呢? 
其实也很简单, 我们对activeEffect添加一个数组属性, 在track中将set放进去, 然后再在fn执行时将这个数组中的set的这个副作用方法删除即可,
具体步骤如下:
1. 副作用函数上添加属性deps, 他是一个数组, 存放哪些字段的set中有当前的副作用函数 
2. track捕获副作用函数时, 将当前字段对应的set存放进deps这个数组中, 即 deps.push(set)
3. 在我们修改字段后, 触发trigger, 执行副作用函数, 在真正的副作用函数执行前, 我们拿到副作用函数上deps属性中存放的set, 将这些set中的这个副作用函数删除 
4. 执行副作用函数, 触发get, 触发track, 重新收集依赖

接下来我们一条一条进行实现

上述步骤中我们提到, **在真正的副作用函数执行前**, 这其实要求我们对副作用函数封装一层
```js

const effectFn = () => {
  // 这是清楚副作用函数的逻辑
  cleanUp(effectFn);
  
  // 捕获副作用函数
  activeEffect = effectFn;
  
  // 触发真正的副作用函数
  fn();
}

```

则原先的effect方法变为了如下代码, 也就是步骤1要做的事情
1. 副作用函数上添加属性deps, 他是一个数组, 存放哪些字段的set中有当前的副作用函数
```js
// 实现一个方法捕获副作用函数
function effect(fn) {
  const effectFn = () => {
    // 清除副作用函数的逻辑, 后续实现
    cleanUp(effectFn);
    
    // 捕获副作用函数
    activeEffect = effectFn;
    
    // 触发真正的副作用函数
    fn();
  }
  // 我们在这个副作用函数上加上一个数组, 用于存放哪些字段依赖这个副作用函数, 即存放的元素是字段的副作用函数列表set
  effectFn.deps = [];
  effectFn();
}
```

步骤2则只需要我们在track方法中添加一行
2. track捕获副作用函数时, 将当前字段对应的set存放进deps这个数组中, 即 deps.push(set)
```js
// get中追踪副作用方法
function track(target, key) {
  // 找到当前对象target对应的map
  let dependsMap = globalDependsMap.get(target);
  // 没有则为该对象创建
  if(!dependsMap) {
    globalDependsMap.set(target, (dependsMap = new Map()));
  }
  // 找到key属性对应的副作用set
  let dependsSet = dependsMap.get(key);
  // 没有则为该属性创建
  if(!dependsSet) {
    dependsMap.set(key, dependsSet = new Set())
  }
  // 添加副作用
  dependsSet.add(activeEffect);
  
  // 要添加的代码 (将副作用函数列表set添加到当前副作用函数的deps数组中)
  activeEffect.deps.push(dependsSet);
}
```

步骤3其实就是步骤1中cleanUp的实现
3. 在我们修改字段后, 触发trigger, 执行副作用函数, 在真正的副作用函数执行前, 我们拿到副作用函数上deps属性中存放的set, 将这些set中的这个副作用函数删除
```js
function cleanUp(effectFn) {
  // effectFn.deps是一个数组, 存放着所有依赖这个副作用方法effectFn的字段的副作用函数列表set
  for(const deps of effectFn.deps) {
    // deps则是某个字段的副作用函数列表set, 我们将其中的当前副作用函数effectFn删除即可
    deps.delete(effectFn);
  }
  // 清空副作用函数的deps
  effectFn.deps.length = 0;
}
```

步骤4其实就是步骤1中effectFn的最后一句fn函数的执行
4. 执行副作用函数, 触发get, 触发track, 重新收集依赖

----


其实到这里还有点问题, 问题发生在步骤3中
3. 在我们修改字段后, 触发trigger, 执行副作用函数, 在真正的副作用函数执行前, 我们拿到副作用函数上deps属性中存放的set, 将这些set中的这个副作用函数删除

trigger中, 我们会去遍历set执行副作用, 例如某次遍历, 我们会在最终副作用fn方法执行前删除set中的effectFn, 
然而删除后, 又会立马触发fn执行, 则立马触发get, 触发track, 重新收集依赖, 导致又将effectFn加回set中

这相当于我们将set中某个元素删除后又将其添加到set中
```js
const fn1 = () => {console.log(1);}
const fn2 = () => {console.log(2);}
const fn3 = () => {console.log(3);}
const fn4 = () => {console.log(4);}

const s = new Set([fn1, fn2, fn3, fn4])
s.forEach(fn => {
  s.delete(fn);
  fn();
  
  // do something else
  // ...
  
  s.add(fn);
})
```
这会造成代码无限循环执行, 解决方法很简单, 复制出一个set进行执行
```js
const fn1 = () => {console.log(1);}
const fn2 = () => {console.log(2);}
const fn3 = () => {console.log(3);}
const fn4 = () => {console.log(4);}

const s = new Set([fn1, fn2, fn3, fn4])
const setToRun = new Set(s);

setToRun.forEach(fn => {
  s.delete(fn);
  fn();
  
  // do something else
  // ...
  
  s.add(fn);
})
```

即需要将trigger方法修改成如下所示代码
```js
// set中触发副作用方法
function trigger(target, key) {
  // 找到该属性对应的map
  let dependsMap = globalDependsMap.get(target);
  // 没有则直接返回
  if(!dependsMap) {
    return;
  }
  
  // 取出该字段存储副作用函数的set
  const dependsSet = dependsMap.get(key);
  // 没有则直接返回
  if(!dependsSet) {
    return;
  }
  // 新增代码
  const effectsSetToRun = new Set(dependsSet);
  effectsSetToRun.forEach(fn => fn());
  // 删除代码
  // dependsSet && dependsSet.forEach(fn => fn());
}
```

最终输出结果比对

```
// 原输出结果
originalData.textA的副作用方法初始化辣！

originalData.textA的副作用方法又执行辣！
after change {ok: true, textA: 'hahaha'}

originalData.textA的副作用方法又执行辣！
after change {ok: false, textA: 'hahaha'}

originalData.textA的副作用方法又执行辣！
after change {ok: false, textA: 'balabala'}



// 优化后输出结果
originalData.textA的副作用方法初始化辣！

originalData.textA的副作用方法又执行辣！
after change {ok: true, textA: 'hahaha'}

originalData.textA的副作用方法又执行辣！
after change {ok: false, textA: 'hahaha'}

after change {ok: false, textA: 'balabala'}
```

可见第三个settimeout中修改textA并不会再次执行effect中放入的匿名函数








# 5 js对象与proxy的工作原理

## 5.1 直接使用target[key]会有问题

```js
const obj = {
  foo: 1,
  get bar() {
    return this.foo;
  }
}

const p = new Proxy(obj, {
  get(target, key) {
    return target[key];
  }
  // ...
})
```

那么我们使用p.bar，则p的get中相当于返回了 obj.bar

而直接调用obj.bar则会返回 this.foo

此时的this指向obj而非p，导致无法正常触发track与trigger


## 5.2 使用Reflect

```js
// 对一个函数进行调用，并传入指定的 this 值和参数列表。
Reflect.apply(target, thisArgument, argumentsList)

// 使用 new 关键字调用构造函数，并传入指定的参数列表。
Reflect.construct(target, argumentsList, newTarget)

// 获取对象的属性值。
Reflect.get(target, propertyKey, receiver)

// 设置对象的属性值。
Reflect.set(target, propertyKey, value, receiver)

// 删除对象的属性。
Reflect.deleteProperty(target, propertyKey)

// 定义或修改对象的属性。
Reflect.defineProperty(target, propertyKey, attributes)

// 获取对象的属性描述符。
Reflect.getOwnPropertyDescriptor(target, propertyKey)

// 防止新属性被添加到对象。
Reflect.preventExtensions(target)

// 检查对象是否可以扩展。
Reflect.isExtensible(target)

// 返回对象的所有属性（包括不可枚举属性）。
Reflect.ownKeys(target)

// 设置对象的原型。
Reflect.setPrototypeOf(target, prototype)
```

其中target是指对哪个对象，receiver相当于修改this，propertyKey是访问的属性的名字

原案例可以修改为
```js
const obj = {
  foo: 1,
  get bar() {
    return this.foo;
  }
}

const p = new Proxy(obj, {
  // 第三个参数receiver即为代理对象p
  get(target, key, receiver) {
    return Reflect.get(target, key, receiver);
  }
  // ...
})
```

即获取target的key属性, 同时内部执行时this指针修改指向为receiver

则通过p.bar获取bar属性时, p的get方法
(**return Reflect.get(target, key, receiver);**)
相当于返回obj.bar, 但是obj.bar在执行时this指向receiver

这样obj.bar中的返回this.foo相当于返回了p.foo, 这样依然走了代理, 能够正常触发track与trigger



