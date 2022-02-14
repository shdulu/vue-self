import { mergeOptions } from "../util/options";
export function initGlobalAPI(Vue) {
  Vue.options = {}; // 用来存储全局配置,每个组件初始化的时候都会和options选项进行合并
  Vue.mixin = function (mixin) {
    this.options = mergeOptions(this.options, mixin);
    return this;
  };

  Vue.options._base = Vue; // Vue 构造函数
  Vue.options.components = {}; // 用来存方组件的定义

  Vue.component = function (id, definition) {
    definition.name = definition.name || id;
    definition = this.options._base.extend(definition); // 通过对象产生一个构造函数
    this.options.components[id] = definition;
  };
  let cid = 0;
  Vue.extend = function (options) {
    // 子组件初始化时 会 new VueComponent(options)
    const Super = this; // 这里的this 指向Vue
    const Sub = function VueComponent(options) {
      this._init(options);
    };
    Sub.cid = cid++;
    Sub.prototype = Object.create(Super.prototype); // 原型继承
    Sub.prototype.constructor = Sub;
    Sub.component = Super.component;
    Sub.options = mergeOptions(Super.options, options);
    return Sub; // 这个构造函数 由对象产生而来
    // ...
  };
}
