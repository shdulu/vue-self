import serve from "rollup-plugin-serve";
import babel from "rollup-plugin-babel";

export default {
  // 用于打包的配置
  input: "./src/index.js",
  output: {
    file: "dist/vue.js",
    name: "Vue", // 全局的名字
    format: "umd", // window.Vue
    sourcemap: true, // es6 -> es5
  },
  plugins: [
    babel({
      exclude: "node_modules/**",
    }),
    serve({
      openPage: "/public/index.html",
      port: 3000,
      contentBase: "",
      open: true,
    }),
  ],
};
