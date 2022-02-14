/**
 * parent.replaceChild(newnode,oldnode) 用新节点替换某个子节点
 * parent.insertBefore(newItem,existingItem) 在指定的已有子节点之前插入新的子节点
 *
 * */

import { isSomeVnode } from "./index";
export function patch(oldVnode, vnode) {
  if (oldVnode === vnode) return;
  if (!oldVnode) {
    // 如果老的vdom 不存在 新增
    return createElm(vnode); // 根据虚拟节点创建元素
  }
  const isRealElement = oldVnode.nodeType; // 先判断老的虚拟节点的 nodetype 是否存在，存在说明是真实节点
  if (isRealElement) {
    // 初次渲染
    const oldElm = oldVnode; // id ="app"
    const parentElm = oldElm.parentNode; // body
    let el = createElm(vnode); // 根据虚拟节点创建新的真实节点
    parentElm.insertBefore(el, oldElm.nextsibling); // 将创建的节点 插入到原有的节点下一个
    parentElm.removeChild(oldElm); // 移除老节点
    return el;
  } else {
    // diff 算法 是两个虚拟节点的比对

    // 1.新旧虚拟节点标签类型进行比对
    //  _1.1 标签类型不一致 用新的虚拟节点创建真实dom替换老的dom
    //  _1.2 标签类型一致 => 判断是否是文本类型
    //  _1.2.1 是文本：新文本替换老文本
    //  _1.2.2 非文本类型
    if (oldVnode.tag !== vnode.tag) {
      // 用新节点 替换 老节点
      // 1. 如果两个虚拟节点的标签不一致 那就直接替换 div => p
      return oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el);
    }
    // 2.标签一样 但是是两个文本元素 {tag: undefined, text: 'text value'}
    if (!oldVnode.tag) {
      // 标签相同 并且是文本
      if (oldVnode.text !== vnode.text) {
        return (oldVnode.el.textContent = vnode.text);
      }
    }

    // 3.元素相同, 复用老节点，并且更新属性
    let el = (vnode.el = oldVnode.el);
    // 用老的属性和新的虚拟节点进行比对
     (vnode, oldVnode.data);

    // 4.更新儿子
    let oldChildren = oldVnode.children || [];
    let newChildren = vnode.children || [];
    if (oldChildren.length > 0 && newChildren.length > 0) {
      // 4.1.老的有儿子新的也有儿子 dom-diff
      patchChildren(el, oldChildren, newChildren);
    } else if (oldChildren.length > 0) {
      // 4.2.老的有儿子 新的没有儿子 => 删除老的儿子
      el.innerHTML = ""; // 清空 删除所有节点
    } else if (newChildren.length > 0) {
      // 4.3.老的没有儿子 新的有儿子 => 在老节点上面增加儿子即可
      newChildren.forEach((child) => el.appendChild(createElm(child)));
    }
    return el;
  }
}

function patchChildren(parent, oldChildren, newChildren) {
  let oldStartIndex = 0; // 老的头索引
  let oldEndIndex = oldChildren.length - 1; // 老的尾索引
  let oldStartVnode = oldChildren[0]; // 老的开始节点
  let oldEndVnode = oldChildren[oldEndIndex]; // 老的结束节点

  let newStartIndex = 0; // 新的头索引
  let newEndIndex = newChildren.length - 1; // 新的尾索引
  let newStartVnode = newChildren[0]; // 新的开始节点
  let newEndVnode = newChildren[newEndIndex]; // 新的结束节点

  function makeIndexByKey() {
    let map = {};
    oldChildren.forEach((item, index) => {
      map[item.key] = index; // {A: 0, B:1, C: 2, D:3,E: 4}
    });
    return map;
  }
  let map = makeIndexByKey();

  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    // 同时循环新老节点 有一方循环完毕
    // 1. 前端中比较常见的操作有 尾部插入 头部插入， 头移动到尾 尾移动到头 正序 反序
    // 1) 向后插入操作
    if (!oldStartVnode) {
      oldStartVnode = oldChildren[++oldStartIndex];
    } else if (!oldEndVnode) {
      oldEndVnode = oldChildren[--oldEndIndex];
    } else if (isSomeVnode(oldStartVnode, newStartVnode)) {
      // 头和头相同
      // 新头指针和老头指针都后移下一位(下一个对比)
      patch(oldStartVnode, newStartVnode); // 递归深层比对
      oldStartVnode = oldChildren[++oldStartIndex];
      newStartVnode = newChildren[++newStartIndex];
    } else if (isSomeVnode(oldEndVnode, newEndVnode)) {
      // 2) 向前插入操作
      patch(oldEndVnode, newEndVnode); // 递归深层比对
      oldEndVnode = oldChildren[--oldEndIndex];
      newEndVnode = newChildren[--newEndIndex];
    } else if (isSomeVnode(oldStartVnode, newEndVnode)) {
      // 3) 老的头等于新的尾 => 老的头 移动到 老的尾的下一个的前面
      patch(oldStartVnode, newEndVnode);
      parent.insertBefore(oldStartVnode.el, oldEndVnode.el.nextsibling);
      oldStartVnode = oldChildren[++oldStartIndex]; // 头后移
      newEndVnode = newChildren[--newEndIndex]; // 尾前移
    } else if (isSomeVnode(oldEndVnode, newStartVnode)) {
      patch(oldEndVnode, newStartVnode);
      parent.insertBefore(oldEndVnode.el, oldStartVnode.el);
      oldEndVnode = oldChildren[--oldEndIndex];
      newStartVnode = newChildren[++newStartIndex];
    } else {
      // oldVnode [A B C D F]
      // newVnode [N A C B E]
      // [N|新 A|老 C|老且移动 B|老 E|新]

      // 头和头 尾和尾 头尾|尾头 上面四个逻辑先走一遍
      // 都不符合 ->
      // 1. 查找新当前项 在老列表中是否有相同的
      //    1.1 没有的话 新当前项插入到老头指针前 新头指针后移到下一项, 再次对比 -> )
      //    1.2 有的话 将老列表中找到的相同项 移动 新头指针前一位，并且将当前节点置为null,老头指针后移
      // 重复 头和头 尾和尾 头尾|尾头 上面四个逻辑
      // 2.
      // 如果查找到相同项 把老匹配移动到 老指针前一位 并把当前老位置 置为null， 新指针后移
      // 新头指针移动到新尾指针，老头指针剩余项移除不要

      // 1. 需要先查找当前老节点索引和key关系，移动的时候通过新的key去查找对应的老节点索引
      let moveIndex = map[newStartVnode.key];
      if (moveIndex == undefined) {
        parent.insertBefore(createElm(newStartVnode), oldStartVnode.el);
      } else {
        let moveVnode = oldChildren[moveIndex];
        oldChildren[moveIndex] = undefined; // 占位
        patch(moveVnode, newStartVnode); // 如果找到了需要两个虚拟节点比对，更新属性
        parent.insertBefore(moveVnode.el, oldStartVnode.el);
      }
      newStartVnode = newChildren[++newStartIndex];
    }
  }
  if (newStartIndex <= newEndIndex) {
    // 新的比老的多 插入新节点
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      // 向前插入 向后插入
      // 看一下 newEndIndex 下一个节点有没有值
      let nextEle =
        newChildren[newEndIndex + 1] == null
          ? null
          : newChildren[newEndIndex + 1].el;
      // 如果 insertBefore(ele, null) 等价于 appendChild
      parent.insertBefore(createElm(newChildren[i]), nextEle);
    }
  }
  if (oldStartIndex <= oldEndIndex) {
    // 老的多余新的
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      const child = oldChildren[i];
      if (child !== undefined) {
        parent.removeChild(child.el); // 用父亲移除儿子
      }
    }
  }
}

function patchProps(vnode, oldProps = {}) {
  let newProps = vnode.data || {}; // 属性
  let el = vnode.el;
  // 1.老的属性 新的没有 删除属性
  for (let key in oldProps) {
    if (!newProps[key]) {
      el.removeAttribute(key);
    }
  }
  let newStyle = newProps.style || {};
  let oldStyle = oldProps.style || {};
  for (let key in oldStyle) {
    // 判断样式
    if (!newStyle[key]) {
      el.style[key] = "";
    }
  }

  // 2.新的属性 老的没有 直接用新的覆盖不考虑有没有
  for (let key in newProps) {
    if (key === "style") {
      for (let styleName in newProps.style) {
        el.style[styleName] = newProps.style[styleName];
      }
    } else if (key === "class") {
      el.className = newProps.class;
    } else {
      el.setAttribute(key, newProps[key]);
    }
  }
}

function createComponent(vnode) {
  let i = vnode.data;
  if ((i = i.hook) && (i = i.init)) {
    i(vnode); // 调用组件的初始化方法
  }
  if (vnode.componentInstance) {
    return true;
  } else {
    return false;
  }
}

// 根据虚拟节点 创建真实节点
export function createElm(vnode) {
  let { tag, children, key, data, text, vm } = vnode;
  if (typeof tag === "string") {
    // 可能是组件 如果是组件 就直接根据组件创建出组件对应的真实节点
    if (createComponent(vnode)) {
      // 如果返回true 说明这个虚拟节点是组件
      // 如果是组件就将租金按渲染后的真实元素 给我
      return vnode.componentInstance.$el;
    }
    vnode.el = document.createElement(tag);
    patchProps(vnode);
    children.forEach((child) => {
      vnode.el.appendChild(createElm(child));
    });
  } else {
    vnode.el = document.createTextNode(text);
  }
  return vnode.el;
}
