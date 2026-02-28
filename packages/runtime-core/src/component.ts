import {reactive} from "@vue/reactivity";
import {hasOwn, isFunction, isType} from "@vue/shared";

export function createComponentInstance(vnode) {
  return {
    // 数据状态
    data: null,
    
    // 组件的虚拟节点
    vnode,
    
    // 子树
    subTree: null,
    
    // 是否挂载完成
    isMounted: false,
    
    // 更新函数
    update: null,
    
    // 用户声明的props选项
    propsOptions: vnode.type.props || {},
    
    // 根据用户声明的props与传入的所有属性进行分离，得到props和attrs
    props: {},
    attrs: {},
    
    // instance对象的代理
    proxy: null,
  }
}

// attrs是非响应式的，props是响应式的，用户在组件内定义要接收的props，如果传入的属性没有定义接收则放在attrs中
const initProps = (instance, rawProps) => {
  const props = {};
  const attrs = {};
  
  const definedProps = instance.propsOptions;
  if(rawProps) {
    for(const key in rawProps) {
      const type = definedProps[key];
      const value = rawProps[key];
      if(key in definedProps) {
        // props  用户在组件内定义要接收的props
        if(!isType(value, type)) {
          console.error(`key: '${key}' is not format type '${type.name}'`)
        }
        props[key] = value;
      } else {
        // attrs 传入的参数但是没有定义接收
        attrs[key] = value;
      }
      
    }
  }
  
  instance.attrs = attrs;
  // TODO: 应该使用shallowReactive，但是还没有实现shallowReactive，暂时使用reactive代替
  instance.props = reactive(props);
}

const publicProperties = {
  $attrs: (instance) => instance.attrs,
}

const handler =  {
  get(target, key) {
    const { data, props, attrs } = target;
    if(data && hasOwn(data, key)) {
      return data[key];
    } else if(props && hasOwn(props, key)) {
      return props[key];
    }
    // 一些不可修改的如$attrs $slots等属性只有get没有set，并使用publicProperties设置不同的取值策略
    const getter = publicProperties[key];
    if(getter) {
      return getter(target);
    }
  },
  set(target, key, value) {
    const { data, props } = target;
    if(data && hasOwn(data, key)) {
      data[key] = value;
      return true;
    } else if(props && hasOwn(props, key)) {
      console.warn(`Attempting to mutate prop "${String(key)}". Props are readonly.`);
      return false;
    } else {
      target[key] = value;
    }
    return true;
  }
}

export function setupComponent(instance) {
  const { vnode } = instance;
  const { data = () => {return {}}, render } = vnode.type;
  
  // 根据传入的属性与用户声明接收的属性，分离出props和attrs
  initProps(instance, vnode.props);
  
  // 对instance代理，将数据指向data、props、$attrs等属性
  instance.proxy = new Proxy(instance, handler)
  
  if(!isFunction(data)) {
    return console.error('The data option must be a function');
  }
  
  // 生成组件实例的响应式数据，并挂载到instance上
  // 使用call将data函数中的this指向instance.proxy这样在data函数中就可以通过this访问到组件实例的代理对象，从而访问到props、$attrs等属性
  instance.data = reactive(data.call(instance.proxy));
  
  // 将组件render函数挂载到instance上
  instance.render = render;
}




