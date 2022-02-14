// props methods data computend watch
import { observe } from "./observe/index";
import { isObject } from "./util/utils";
import Watcher from "./observe/watcher";
import Dep from "./observe/dep";

export function initState(vm) {
  // 将所有数据都定义在vm属性上， 并且后续更改需要出发视图的更新
  vm._watchers = [];
  const opts = vm.$options;
  if (opts.data) {
    // 数据初始化
    initData(vm);
  } else {
    observe((vm._data = {}), true /* asRootData */);
  }
  if (opts.computed) initComputed(vm, opts.computed);

  if (opts.watch && opts.watch !== {}.watch) {
    initWatch(vm, opts.watch);
  }
}

function proxy(vm, source, key) {
  Object.defineProperty(vm, key, {
    get() {
      return vm[source][key];
    },
    set(newValue) {
      vm[source][key] = newValue;
    },
  });
}

function initData(vm) {
  // 对 data 数据劫持 Object.defineProperty
  let data = vm.$options.data;
  // 对 data 类型进行判断 如果是函数获取函数返回值   data.call(vm) 保证data中的this指向当前实例
  data = vm._data = typeof data === "function" ? data.call(vm) : data || {};
  // vm._data 获取劫持后的数据， 这样用户就可以拿到 _data 但是希望直接使用 vm.prop
  // 将_data 中的数据 代理到 data中

  for (let key in data) {
    proxy(vm, "_data", key);
  }
  observe(data, true /* asRootData */); // 监听拦截数据
}

function initComputed(vm, computed) {
  const watchers = (vm._computedWatchers = {});
  const keys = Object.keys(computed);
  keys.forEach((key) => {
    const userDef = computed[key];
    // 依赖的属性变化就重新取值 get
    let getter = typeof userDef === "function" ? userDef : userDef.get;
    // 每个计算属性的本质就是 watcher
    // 将watcher 和属性做一个映射
    watchers[key] = new Watcher(vm, getter, () => {}, { lazy: true });
    // 将key 定义在vm上
    defineComputed(vm, key, userDef);
  });
}
let sharedProperty = {};
function defineComputed(vm, key, userDef) {
  if (typeof userDef === "function") {
    sharedProperty.get = userDef;
  } else {
    sharedProperty.get = createComputedGetter(key); // dirty 脏的才取值
    sharedProperty.set = userDef.set;
  }
  Object.defineProperty(vm, key, sharedProperty);
}
// 高阶函数
function createComputedGetter(key) {
  return function computedGetter() {
    // 取计算属性的值 走的是这个函数
    // 包含当前实例所有的计算属性 通过key可以拿到key对应的watcher，watcher中包含了 更新函数getter
    let watcher = this._computedWatchers[key];
    if (watcher.dirty) {
      // 脏的需要求值
      watcher.evaluate();
    }
    // 如果当前取完值后 Dep.target 还有值 继续往上收集
    if (Dep.target) {
      // 计算属性watcher 内部有两个dep firstName, lastName
      watcher.depend();
    }
    return watcher.value;
  };
}

function initWatch(vm, watch) {
  for (const key in watch) {
    const handler = watch[key];
    if (Array.isArray(handler)) {
      // watch 的 handler 可以为数组
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}

function createWatcher(vm, exprOrFn, handler, options) {
  if (isObject(handler)) {
    options = handler;
    handler = handler.handler;
  }
  if (typeof handler === "string") {
    handler = vm[handler] || vm.$options.methods[handler]; // 这里需要优化
  }
  // watcher 的原理 就是 $watch
  return vm.$watch(exprOrFn, handler, options);
}

export function stateMixin(Vue) {
  Vue.prototype.$watch = function (exprOrFn, cb, options = {}) {
    options.user = true; // 用户自己写的watcher
    new Watcher(this, exprOrFn, cb, options);
    if (options.immediate) {
      cb.call(this, watcher.value);
    }
  };
}
