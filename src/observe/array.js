let oldArrayProtoMethods = Array.prototype;

// 不能直接改写数组原型方法， 因为之后被vue 响应式的才需要改写
export let arrayMethods = Object.create(Array.prototype); // 创建一个对象继承数组原型对象

// 改变原数组的七个方法
let methods = ["push", "pop", "shift", "unshift", "splice", "reverse", "sort"];

methods.forEach((m) => {
  // 重写数组方法
  arrayMethods[m] = function (...args) {
    // AOP 切片编程
    // 更新视图 todo...
    // 调用 原数组原型方法
    let result = oldArrayProtoMethods[m].call(this, ...args);
    let inserted;
    let ob = this.__ob__;
    switch (m) {
      case "push":
      case "unshift":
        inserted = args;
        break;
      case "splice":
        inserted = args.slice(2);
        break;
    }
    if (inserted) {
      ob.observeArray(inserted);
    }
    ob.dep.notify();
    return result;
  };
});
