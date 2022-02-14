import { pushTarget, popTarget } from "./dep";
import { queueWatcher } from "./schedular";
let uid = 0;
export default class Watcher {
  constructor(vm, exprOrFn, cb, options) {
    this.vm = vm;
    this.cb = cb;
    this.options = options;
    this.user = !!options.user; // 是不是用户watcher
    this.sync = options.sync;
    this.lazy = options.lazy; // computed 计算属性 默认不执行get
    this.dirty = options.lazy; // 如果是计算属性 默认是lazy 为true dirty也为true
    this.uid = uid++;
    if (typeof exprOrFn === "function") {
      this.getter = exprOrFn; // vm._update(vm._render())
    }
    if (typeof exprOrFn === "string") {
      // 用户自定义watch
      this.getter = function () {
        // obj.data.name 当前实例上取值
        let path = exprOrFn.split("."); // ['obj','data','name']
        let obj = vm;
        for (let i = 0; i < path.length; i++) {
          obj = obj[path[i]];
        }
        return obj;
      };
    }
    this.deps = [];
    this.depsId = new Set();
    this.value = this.lazy ? undefined : this.get(); // 调用传入的更新函数, 调用了render方法， 此时会对模板中的数据进行取值
  }
  get() {
    // 这个方法中 会对属性进行取值操作
    pushTarget(this); // 取值前操作：dep记住当前watcher
    const value = this.getter.call(this.vm); // vm._update(vm._render()) 取值
    popTarget(); // 取值后操作：template 渲染完之后卸载 watcher 所以未在模板中使用的属性不会被收集
    return value;
  }
  // dep 获取属性get操作时 调用 dep.depend() -> watcher.addDep(this)
  addDep(dep) {
    let id = dep.id;
    if (!this.depsId.has(id)) {
      // dep 是非重复的
      this.depsId.add(id);
      this.deps.push(dep);
      dep.addSub(this); // 让dep 记住watcher
    }
  }
  run() {
    let oldValue = this.value; // 第一次渲染的值
    let newValue = this.get();
    this.value = newValue; // 为了保证下一次更新时，上一次的最新值是下一次的老值
    if (this.user) {
      // 用户 watcher 执行用户自定义的 callback
      this.cb.call(this.vm, oldValue, newValue);
    }
  }
  update() {
    if (this.lazy) {
      // 计算属性
      this.dirty = true;
    } else {
    }
    if (this.sync) {
      this.run();
    } else {
      // 同一个属性 set 会触发多次更新， 多次更改希望 合并称一次，维护一个queue 队列
      queueWatcher(this);
    }
  }
  evaluate() {
    this.dirty = false; // 计算属性取过值
    this.value = this.get(); // 用户get执行
  }
  depend() {
    let i = this.deps.length;
    while (i--) {
      this.deps[i].depend(); // lastName, firstName 收集渲染watcher
    }
  }
}
