import { arrayMethods } from "./array";
import { def } from "../util/index";
import Dep from "./dep";

// 检测数据变化 为啥使用类呢，类有类型
class Observer {
  // 类 下面的 walk 和类整体再一起
  constructor(value) {
    // 需要对value属性重新拦截定义
    // value.__ob__ = this; 这样写会死循环
    this.dep = new Dep(); // 给数组本身 和 对象本身添加一个 dep 属性
    this.vmCount = 0;
    def(value, "__ob__", this); // 设置一个__ob__ 属性引用当前Observer实例

    if (Array.isArray(value)) {
      // 数组不用defineProperty 代理性能太差
      // push shift pop unshift sort reverse splice 重写方法
      Object.setPrototypeOf(value, arrayMethods);
      this.observeArray(value); // 观测 原有 数组中的对象
    } else {
      this.walk(value);
    }
  }
  walk(obj) {
    // 将对象中的所有key 重新用defineProperty 定义成响应式
    Object.keys(obj).forEach((key) => {
      defineReactive(obj, key, obj[key]);
    });
  }
  observeArray(data) {
    for (let i = 0; i < data.length; i++) {
      observe(data[i]);
    }
  }
}

// 数组递归 里层数组收集外层依赖(同一个watcher)，里层数组变化的时候 视图能更新
function dependArray(value) {
  for (let i = 0; i < value.length; i++) {
    let current = value[i]; 
    current.__ob__ && current.__ob__.dep.depend();
    if (Array.isArray(current)) {
       (current);
    }
  }
}

// vue2 会对对象深层递归遍历，将每个属性 用defineProperty 重新定义 性能差
export function defineReactive(data, key, value) {
  const property = Object.getOwnPropertyDescriptor(data, key);
  if (property && property.configurable === false) {
    return;
  }

  let childOb = observe(value); // 递归劫持
  let dep = new Dep(); // 每次都会给属性创建一个dep 用来存 watcher

  Object.defineProperty(data, key, {
    configurable: true,
    enumerable: true,
    get() {
      // 需要给每一个属性都增加一个dep
      if (Dep.target) {
        dep.depend(); // 让这个属性自己的dep 记住这个watcher，也要让watcher记住这个dep
        // 如果对数组或者对象取值 会将当前的watcher和数组进行关联
        childOb && childOb.dep.depend();
        if (Array.isArray(value)) {
          dependArray(value);
        }
      }
      return value;
    },
    set(newValue) {
      if (newValue === value) return;
      observe(newValue); // 如果用户设置的是一个新对象， 就继续将用户设置的对象设置成响应式
      value = newValue;
      dep.notify(); // 通知记录的 watcher 让它去执行
    },
  });
}

export function observe(data, asRootData) {
  // 只会对对象类型进行观测
  if (typeof data !== "object" || data === null) {
    return;
  }
  let ob;
  if (data.hasOwnProperty("__ob__")) {
    ob = data.__ob__;
  } else {
    ob = new Observer(data); // 通过类实现对数据的观测， 类方便扩展，会产生实例
  }
  if (asRootData && ob) {
    ob.vmCount++;
  }
  return ob;
}
