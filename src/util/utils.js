export const isObject = (val) => typeof val === "object" && val !== null;

function makeUp(str) {
  const map = {};
  str.split(",").forEach((tagName) => {
    map[tagName] = true;
  });
  return (tag) => map[tag] || false;
}
export const isReservedTag = makeUp(
  "a,p,div,ul,li,span,input,button,select,table,td,tr,th,h1,h2,h3,h4,h5,h6"
);

export function isUndef(v) {
  return v === undefined || v === null;
}
