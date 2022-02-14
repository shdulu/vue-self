let callbacks = [];
let waiting = false;
function flushCallbacks() {
  for (let i = 0; i < callbacks.length; i++) {
    let callback = callbacks[i];
    callback();
  }
  waiting = false;
  callbacks = [];
}

// 批处理 第一次开定时器， 后续只更新列表， 最后执行清空逻辑
// nextTick 肯定有异步功能
let timerFn = () => {};
if (Promise) {
  timerFn = () => {
    Promise.resolve().then(flushCallbacks);
  };
} else if (MutationObserver) {
  let textNode = document.createTextNode(1);
  let observe = new MutationObserver(flushCallbacks);
  observe.observe(textNode, {
    characterData: true,
  });
  timerFn = () => {
    textNode.textContent = 3;
  };
} else if (setImmdiate) {
  timerFn = () => {
    setImmdiate(flushCallbacks);
  };
} else {
  timerFn = () => {
    setTimeout(flushCallbacks);
  };
}

export function nextTick(cb) {
  callbacks.push(cb); // 默认的cb 是渲染逻辑， 用户的逻辑放到 渲染逻辑之后
  if (!waiting) {
    waiting = true;
    // 1.promise > mutationObserver > setImmdiate > setTimeout
    Promise.resolve().then(timerFn); // 多次调用nexttick 只会开启一个 Promise
  }
}
