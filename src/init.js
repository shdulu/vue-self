import { initState } from "./state";
import { compileToFunctions } from "./compiler/index";
import { callHook, mountComponent } from "./lifecycle";
import { nextTick } from "./util/next-tick";
import { mergeOptions } from "./util/options";

export function initMixin(Vue) {
  Vue.prototype._init = function (options) {
    const vm = this;
    vm.$options = mergeOptions(vm.constructor.options, options); // 实例上 有个属性 $options表示用户转入的所有属性
    callHook(vm, "beforeCreate");
    // 对数据进行初始化 watch props data computed
    initState(vm); // 初始化状态
    callHook(vm, "created");
    if (vm.$options.el) {
      // 数据可以挂在到页面上
      vm.$mount(vm.$options.el);
    }
  };
  Vue.prototype.$nextTick = nextTick;
  Vue.prototype.$mount = function (el) {
    el = el && document.querySelector(el);
    // 把模板转化成 对应的渲染函数 => 虚拟dom概念 =>  diff算法 更新虚拟dom => 产生真实节点
    const vm = this;
    const options = vm.$options;
    vm.$el = el;
    // 如果有 render 直接用render
    // 没有 render 看有没有 template
    // 没有template 找外部模板
    if (!options.render) {
      let template = options.template;
      if (!template && el) {
        template = el.outerHTML; // 火狐不兼容
      }
      // 如何将模板编译成 render 函数 => 虚拟dom => diff算法 更新虚拟dom => 产生真实dom
      const render = compileToFunctions(template);
      options.render = render;
    }
    mountComponent(vm); // 组件挂载
  };
}
