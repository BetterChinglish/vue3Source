import minimist from 'minimist';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// node scripts/dev.js reactivity -f esm
// 其中 reactivity -f esm === process.argv.slice(2)
const args = minimist(process.argv.slice(2));
// console.log(args);  // { _: [ 'reactivity' ], f: 'esm' }

// 打包的项目
const target = args._[0] || 'reactivity';

// 打包的格式
const format = args.f || 'iife';

// node 的esm不支持__dirname
// const entry = resolve(__dirname)

// import.meta.url是当前devjs的绝对路径，但是以file协议开头，使用fileURLToPath转换为绝对路径
const __filename = fileURLToPath(import.meta.url);

// __dirname是当前文件的目录
const __dirname = resolve(__filename, '..');

// 使用require语法
const require = createRequire(import.meta.url);


// 我们后续默认每个模块的入口文件都是src/index.ts
const entry = resolve( __dirname, `../packages/${target}/src/index.ts` );



