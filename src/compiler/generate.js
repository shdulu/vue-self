const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{}}

// html字符串 => _c('div', {id: 'app', a: 1}, 'hello')
export function generate(el) {
  // 遍历树 将树拼接成字符串
  let children = genChildren(el);
  let code = `_c('${el.tag}', ${
    el.attrs.length ? genProps(el.attrs) : "undefined"
  } ${children ? "," + children : ""})`;
  return code; 
}

function genProps(attrs) {
  let str = "";
  for (let i = 0; i < attrs.length; i++) {
    let attr = attrs[i];
    if (attr.name === "style") {
      let styleObj = {};
      // attr.value.replace(/([^;:]+)\:([^;:]+)/g, function() {
      //   styleObj[arguments[1]] = arguments[2]
      // })
      attr.value.split(";").forEach((item) => {
        let [key, value] = item.split(":");
        styleObj[key] = value;
      });
      attr.value = styleObj;
    }
    str += `${attr.name}:${JSON.stringify(attr.value)},`;
  }
  return `{${str.slice(0, -1)}}`;
}

function genChildren(el) {
  const children = el.children;
  if (children) {
    return children.map((child) => gen(child)).join(",");
  }
}
function gen(node) {
  // 区分元素 还是文本
  if (node.type === 1) {
    return generate(node);
  } else if (node.type === 3) {
    // 文本不能用 _c 处理
    // 有 {{}} 普通文本 混合文本:{{aa}} aaa
    let text = node.text;
    if (defaultTagRE.test(text)) {
      // _s(_v(xxx))+_v('aa')  带有 {{}} 的
      let tokens = [];
      let match;
      let index = 0;
      let lastIndex = (defaultTagRE.lastIndex = 0); // 每次匹配 把lastIndex 置为 0
      // hello {{arr}} world => 'hello'+arr+'world'
      while ((match = defaultTagRE.exec(text))) {
        index = match.index; // 开始索引
        if (index > lastIndex) {
          tokens.push(JSON.stringify(text.slice(lastIndex, index)));
        }
        tokens.push(`_s(${match[1].trim()})`);
        lastIndex = index + match[0].length;
      }
      if (lastIndex < text.length) {
        tokens.push(JSON.stringify(text.slice(lastIndex)));
      }
      return `_v(${tokens.join("+")})`;
    } else {
      return `_v(${JSON.stringify(text)})`;
    }
  }
}
