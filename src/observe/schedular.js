import { nextTick } from "../util/next-tick";

let has = {};
let pending = false;
let queue = [];
function flushSchedularQueue() {
  for (let i = 0; i < queue.length; i++) {
    const watcher = queue[i];
    watcher.run();
  }
  queue = [];
  has = {};
  pending = false;
}

// 多次调用 queueWatcher 如果 watcher 不是同一个

export function queueWatcher(watcher) {
  // 调度更新几次
  // 更新时对 watcher 进行去重操作
  let uid = watcher.uid;
  if (has[uid] == null) {
    queue.push(watcher);
    has[uid] = true;
    // setTimeout(flushSchedularQueue, 0);
    if (!pending) {
      pending = true;
      nextTick(flushSchedularQueue);
    }
  }
}
