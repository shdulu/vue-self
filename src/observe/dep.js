// 可以把当前的watcher 放到 一个全局变量上
let uid = 0;
class Dep {
  constructor() {
    this.id = uid++;
    this.subs = []; // 属性要记住watcher
  }
  depend() {
    // 让watcher 记住这个 dep  调用watcher下的 addDep方法
    Dep.target.addDep(this);
  }
  addSub(watcher) {
    this.subs.push(watcher);
  }
  notify() {
    this.subs.forEach((watcher) => {
      watcher.update();
    });
  }
}

Dep.target = null;
let stack = [];

export function pushTarget(watcher) {
  Dep.target = watcher;
  stack.push(watcher);
}
export function popTarget() {
  stack.pop();
  Dep.target = stack[stack.length - 1];
}

export default Dep;
