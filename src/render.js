import { createElement, createTextVnode } from "./vdom/index";
export function renderMixin(Vue) {
  // 创建元素虚拟节点
  Vue.prototype._c = function (...args) {
    return createElement(this, ...args);
  };
  // 创建文本虚拟节点
  Vue.prototype._v = function (text) {
    return createTextVnode(this, text);
  };
  // 转换成字符串
  Vue.prototype._s = function (value) {
    return value == null
      ? ""
      : typeof value === "object"
      ? JSON.stringify(value)
      : value;
  };

  Vue.prototype._render = function () {
    const vm = this;
    let render = vm.$options.render; // 获取编译后的render 方法
    let vnode = render.call(vm); // 调用 render 产生虚拟节点
    return vnode;
  };
}
