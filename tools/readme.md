# build
___

## 安装
```bash
#全局安装rollup
npm install rollup -g
# 安装压缩插件
npm install
```
## build 未压缩版本
修改rollup.config.js，把`plugins:[uglify()]`注释掉
```bash
npm run build-pc
npm run build-m
```

## build 压缩版本
修改rollup.config.js，把`plugins:[uglify()]`不要注释
```bash
npm run build-pc
npm run build-m

```

## 使用方法
构建的js文件为dist/store.js,暴露的全局变量名字为`ppStore`,通过`moduleName`配置,具体见example/index.html
