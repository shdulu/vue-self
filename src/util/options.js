import { isObject } from "./utils";

const LIFECYCLE_HOOKS = [
  "beforeCreate",
  "created",
  "beforeMount",
  "mounted",
  "beforeUpdate",
  "updated",
  "beforeDestroy",
  "destroyed",
];
const strats = {};

LIFECYCLE_HOOKS.forEach((hook) => {
  strats[hook] = mergeHook;
});

function mergeHook(parentVal, childVal) {
  if (childVal) {
    if (parentVal) {
      return parentVal.concat(childVal);
    } else {
      return [childVal];
    }
  } else {
    return parentVal;
  }
}
// strats.data = function () {};
// 组件合并策略
strats.components = function (parentVal, childVal) {
  const res = Object.create(parentVal);
  if (childVal) {
    for (let key in childVal) {
      res[key] = childVal[key];
    }
  }
  return res;
};

export function mergeOptions(parent, child) {
  const options = {};
  // 如果parent有 child没有 用 parent
  // 如果parent有 child也有 应该用child替换掉parent

  for (let key in parent) {
    mergeField(key);
  }
  for (const key in child) {
    if (!parent.hasOwnProperty(key)) {
      mergeField(key);
    }
  }
  function mergeField(key) {
    // 策略模式
    if (strats[key]) {
      return (options[key] = strats[key](parent[key], child[key]));
    }
    if (isObject(parent[key]) && isObject(child[key])) {
      options[key] = { ...parent[key], ...child[key] };
    } else {
      if (child[key]) {
        // child 有值
        options[key] = child[key];
      } else {
        options[key] = parent[key];
      }
    }
  }
  return options;
}
