import Watcher from "./observe/watcher";
import { patch } from "./vdom/patch";

export function lifecycleMixin(Vue) {
  Vue.prototype._update = function (vnode) {
    // 将虚拟节点 转换成真实 dom
    const vm = this;
    // 首次渲染 需要用虚拟节点 来更新真是dom 元素
    // 初始化渲染的时候 会创建一个新节点 并且将老节点删掉
    // 第一次走初始化，第二次走diff算法
    const prevVnode = vm._vnode; // 先取上一次的vnode 看一下是否有
    if (!prevVnode) {
      vm.$el = patch(vm.$el, vnode);
    } else {
      vm.$el = patch(prevVnode, vnode);
    }
    vm._vnode = vnode; // 保存上一次的虚拟节点
  };
}

export function mountComponent(vm) {
  // 默认 vue是通过watcher来渲染的 = 渲染watcher（每一个组件都有一个渲染watcher）
  let updateCompoennt = () => {
    vm._update(vm._render()); // render返回虚拟节点 update
  };
  callHook(vm, "beforeMount");
  // vm 要渲染的实例 updateCompoennt cb, ture 渲染watcher  vm._update(vm._render())
  new Watcher(vm, updateCompoennt, () => {}, true); // 等价于 执行updateCompoennt
}

export function callHook(vm, hook) {
  // 发布模式
  const handlers = vm.$options[hook];
  if (handlers) {
    handlers.forEach((handler) => handler.call(vm));
  }
}
