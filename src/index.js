// vue2.0 中就是一个构造函数
// 为啥不用class 类 原型扩展方法不方面 构造函数方式  Vue.prototype._init()
// 原型方法特别多怎么办 拆分到不同文件中更利于代码维护 -> 模块化概念

import { initMixin } from "./init";
import { lifecycleMixin } from "./lifecycle";
import { renderMixin } from "./render";
import { initGlobalAPI } from "./global-api/index";
import { stateMixin } from "./state";

function Vue(options) {
  // options 为用户传入选项
  this._init(options); // 初始化操作， this 指向当前组件实例
}

// 混入 原型方法
initMixin(Vue);
stateMixin(Vue);
lifecycleMixin(Vue); // 扩展 _update 方法
renderMixin(Vue); // 扩展 _render 方法

// 混入静态方法
initGlobalAPI(Vue);

export default Vue;
