// 这个文件打包packages下的模块，最终打包出js文件


// 运行命令: node script/dev.js 要打包的名字 -f 打包的格式
// minimist网址: https://github.com/minimistjs/minimist
import minimist from 'minimist';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import esbuild from 'esbuild';

// node中命令行参数使用process来获取 process.argv
const args = minimist(process.argv.slice(2));

// 获取文件的绝对路径 file:xxx
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// console.log('文件路径', __filename);
// console.log('目录路径', __dirname);

const require = createRequire(import.meta.url);
// console.log(require)

// console.log(args) // { _: [ 'reactivity' ], f: 'esm' }

// 要打包哪个项目
const target = args._[0] || 'reactivity';

// 打包后的模块规范，默认给定iife
const format = args.f || 'iife';

console.log('打包项目:', target)
console.log('打包格式:', format)

// console.log(resolve(__dirname))

// 打包入口文件
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);

// package.json信息
const pkg = require(`../packages/${target}/package.json`);


// 根据需要进行打包, 当前开发环境使用esbuild进行打包
esbuild.context({
  // 入口
  entryPoints: [entry],
  // 出口
  outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`),
  // 如果reactivity依赖shared, 会打包到一起
  bundle: true,
  platform: 'browser',
  sourcemap: true,
  
  // 打包格式 cjs esm iife
  format,
  // 如果是iife自执行函数, 需要给一个名字接收自执行函数结果
  globalName: pkg.buildOptions?.name
  
}).then((ctx) => {
  console.log('打包成功');
  console.log('持续监听中...');
  // 持续监听文件变化，进行打包
  return ctx.watch();
})