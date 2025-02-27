# vue3Source

# 安装pnpm
```shell
npm install -g pnpm
```

# 修改package.json
```json
{
  "private": true
}
```
表明这个项目是一个私有的，不会被发布到npm上

# 新建packages文件夹
一般这个文件夹用于存放其他项目

# .npmrc
添加如下内容
```
shamefully-hoist=true
```
这样做之后pnpm在安装依赖时，会将额外的依赖打平到node_modules下

# 新建pnpm-workspace.yaml
```yaml
packages:
  - 'packages/*'
```
这样做之后pnpm会将packages文件夹下的所有项目当作一个项目来管理

# 安装依赖
由于该项目用作项目管理，如果不加-w则不确定是给packages文件夹下哪个项目安装
```shell
pnpm install vue -w
```
添加-w说明安装到根目录下而非packages文件夹下的项目里

可以将一些公共的依赖放到根目录下，非公共的则放到packages文件夹里对应的项目下

现在安装如下依赖
```shell
pnpm install typescript esbuild minimist -D -w
```

# 创建sripts文件夹
用于存放打包脚本

先创建一个dev.js

# 创建reactivity文件夹
在packages下创建reactivity文件夹

# 修改script命令
```json
{
  "scripts": {
    "dev": "node scripts/dev.js reactivity -f esm"
  }
}
```

这段命令是以node执行scripts文件夹下的dev.js文件

传入reactivity参数表示打包packages/reactivity

-f esm表示以esm格式输出