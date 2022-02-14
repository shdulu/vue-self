import { generate } from "./generate";
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // aa-bb
const qnameCapture = `((?:${ncname}\\:)?${ncname})`; // <h1:tr>
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 可以匹配到标签名 [1]
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // [0] 标签结束名
const startTagClose = /^\s*(\/?)>/;
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 属性匹配
const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{}}

// html 模板 -> ast 语法树 -> 转成 render
// {
//   tag: 'div',
//   type: 1,
//   attrs: [{style: 'color: red'}],
//   children: [
//     {tag: 'span', type: 1, attrs: [], children, parent}
//   ],
//   parent: null
// }

/**
 * Convert HTML string to AST.
 */
function parseHTML(html) {
  let root = null;
  let currentParent;
  let stack = [];
  // 将解析后的结果 组装成一个 树结构 栈
  function createAstElement(tag, attrs) {
    // vue3 支持多个根节点 <外层加了一个空元素> vue2仅支持一个
    return {
      tag,
      type: 1,
      children: [],
      attrs,
      parent: null,
    };
  }

  // 根据开始标签 结束标签 文本内容 生成一个ast 语法树
  function start(tagName, attrs) {
    let element = createAstElement(tagName, attrs);
    if (!root) { // 没有根 当前元素作为根
      root = element;
    }
    currentParent = element; // div. span .a
    stack.push(element); // 开始标签 入栈
  }
  function end(tagName) {
    // [div, div, span]  element = span
    let element = stack.pop(); // 遇到结束标签出栈 删除
    if(element.tag !== tagName) {
      throw new Error('标签有误')
    }
    currentParent = stack[stack.length - 1]; // 他的父亲就是 栈数组中的最后一个
    if (currentParent) {
      element.parent = currentParent; // 给当前元素 记录父亲
      currentParent.children.push(element); // 把它记录到他的父标签的 children 属性中
    }
  }
  function chars(text) {
    text = text.replace(/\s/g, "");
    if (text) {
      currentParent.children.push({
        type: 3,
        text,
      });
    }
  }
  // 解析一点删除一点
  function advance(n) {
    html = html.substring(n);
  }

  // 解析开始标签
  function parseStartTag() {
    const start = html.match(startTagOpen);
    if (start) {
      let match = {
        tagName: start[1],
        attrs: [],
      };
      advance(start[0].length); // 获取元素
      // 查找属性
      let end, attr;
      // 没有遇到当前开头标签的结尾 就一直解析属性
      while (
        !(end = html.match(startTagClose)) &&
        (attr = html.match(attribute))
      ) {
        advance(attr[0].length);
        match.attrs.push({
          name: attr[1],
          value: attr[3] || attr[4] || attr[5] || true,
        });
      }
      if (end) {
        advance(end[0].length);
        return match;
      }
    }
  }
  while (html) { // 看要解析的内容是否存在， 如果存在就不停解析
    // 例如： html = <div id="app">123123</div>
    let textEnd = html.indexOf("<"); // 当前解析的开头
    if (textEnd === 0) { // 可能是开始标签 或者结束标签的 开始
      let startTagMatch = parseStartTag(); // 解析开始标签
      if (startTagMatch) {
        // 开始标签
        start(startTagMatch.tagName, startTagMatch.attrs);
        continue;
      }
      // 结束标签
      let endTagMatch = html.match(endTag);
      if (endTagMatch) {
        advance(endTagMatch[0].length);
        end(endTagMatch[1]);
        continue;
      }
    }
    let text;
    if (textEnd > 0) {
      // 开始解析文本   文本内容 <
      text = html.substring(0, textEnd);
    }
    if (text) {
      advance(text.length);
      chars(text);
    }
  }
  return root;
}

export function compileToFunctions(template) {
  let ast = parseHTML(template.trim());
  let code = generate(ast);
  let render = `with(this){return ${code}}`;
  let fn = new Function(render); // 可以让字符串 变成一个函数
  return fn; // render 函数
}
