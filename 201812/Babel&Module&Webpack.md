# Babel、Module、Webpack

> 关键字：tree-shaking webpack babel transform-runtime

## 相关背景

现代化的业务前端项目里现在主流的是在用webpack做构建，但是由于webpack4之前官方文档的不完善，加上相关技术栈的多样，导致webpack配置一直是前端界的一块难啃的鸡肋。

* 项目融资已经到位，就差一名首席Webpack 配置工程师了

项目背景如下：

1. 有一个webpack构建的项目
2. 使用babel做JS代码转译
3. 项目中有混用ESModule，CommonJSModule的行为
4. 想开启webpack的tree-shaking

## 技术分析

### 1. 为什么要tree-shaking？

一是可以减少代码体积，二是为了方便定位问题

### 2. tree-shaking的原理是什么？

在webpack中，基于ES2015 模块（也叫做 **harmony** 模块）的静态分析能力，也就是说通过静态语法分析，就能找到模块之前的依赖点，进而找出不需要的依赖，在构建阶段就删除不需要的依赖。

> 中文文档：[https://webpack.docschina.org/guides/tree-shaking/](https://webpack.docschina.org/guides/tree-shaking/)

### 3. webpack中如何启用tree-shaking？

* 代码中使用ES2015 模块，在导入时使用按需导入的语法 `import { foo, bar } from './ESModule';`

* webpack默认会进行tree-shaking分析，标记未被使用的导出内容为 **unused harmony export**，但是不会删除相关代码

* 使用uglifyJS等webpack插件会删掉 被webpack标记为 **unused harmony export**的代码

> 参考例子：[https://github.com/SmileSmith/Daily/tree/master/examples/webpack/20181201](https://github.com/SmileSmith/Daily/tree/master/examples/webpack/20181201)

### 4. tree-shaking和babel有什么关系？

babel是个可以配合webpack的编译器，项目中经常用babel-loader来嵌入babel处理代码。重要的是 **babel可能会改变模块类型**，也就是说代码写了import,export语法的ES模块，在Babel处理后会变成CommonJS 的模块。而webapck是无法对动态的CommonJS模块进行语法分析的。

：**所以如果Babel把ES模块转成CommonJS模块，tree-shaking会失效。**

### 5. 如何避免Babel把ESModule转成CommonJSModule呢？

babel-preset中有一个modules配置，默认是`'cjs'`，会把ESModule转成CommonJS。如果不想转成Cjs，就配置babel-preset `modules: false`，以webpack，babelv6，在babel-loader中配置为例：

```js
module: {
    rules: [
        {
            test: /\.js$/,
            exclude: /node_modules/,
            use: [{
                loader: "babel-loader",
                options: {
                    presets: [
                        [
                            "env",
                            {
                                modules: false, // 不对module进行转化处理
                            }
                        ],
                        "stage-2"
                    ],
                    plugins: ["transform-runtime"], // 问题6
                    cacheDirectory: true
                }
            }]
        }
    ]
},
```

> Babel官方文档：[https://babeljs.io/docs/en/next/babel-preset-env#modules](https://babeljs.io/docs/en/next/babel-preset-env#modules)

### 6. 这个问题是什么？

在说明这个问题之前，前置两个点

* babel-plugin-transform-runtime是个解决babel-polyfill问题的插件，会往需要polyfill的模块中 **导入** polyfill代码。Babel官方文档：[https://babeljs.io/docs/en/next/babel-plugin-transform-runtime](https://babeljs.io/docs/en/next/babel-plugin-transform-runtime)

* 现代JS编译器，对于JS模块的解读，如果代码中出现import或者export，它就被当作ESModule。并且，在ESModule中module.exports是保留字，不允许操作，否则会报如下错误

```shell
Cannot assign to read only property 'exports' of object '#<Object>'
```

一个奇怪的问题来了，当满足以下条件时，会出现transform-runtime往**CommonJS模块中import导入polyfill**的代码导致报错：

1. 使用问题5中所示的Babel配置: `modules:false && babel-plugin-transform-runtime`
2. 代码有，在ESModule中导入CommonJSModule的行为`
3. CommonJSModule中有需要polyfill的代码（如直接写Promise）

> 参考例子：[https://github.com/SmileSmith/Daily/tree/master/examples/webpack/20181201](https://github.com/SmileSmith/Daily/tree/master/examples/webpack/20181201)

入口模块index中导入CommonJSModule，CommonJSModule中含有原生Promise写法。在Babel处理时，transform
-runtime会往CommonJSModule中import一段polyfill。导致报错。

* 如果没有`module:false`，transform-runtime往CommonJSModule中导入polyfill会使用reqire的方式，不会报错。但是会导致其它ESModule在webpack中的tree-shaking失效:cry:

* 如果没有transform-runtime，就不会有有polyfill导入，CommonJSModule原样输出，被webpack当作CommonJS模块，不会报错。但是没有transform-runtime，想使用新的语法就得用全局导入babel-polyfill的方式:cry:

### 7. 鱼和熊掌可以兼得吗？

可以，在[https://github.com/babel/babel/issues/9238](https://github.com/babel/babel/issues/9238)中babel说明有一个sourceType选项，可以指定babel对待源文件的方式。对于CommonJS模块，指定为`sourceType: 'script'`，这样transform-runtime在插入polyfill时就会使用require的方式。:yum:

```js
module: {
    rules: [
        {
            test: /CommonJSModule\.js$/,
            exclude: /node_modules/,
            use: [
                {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            [
                                "env",
                                {
                                    modules: "commonjs"
                                }
                            ],
                            "stage-2",
                        ],
                        plugins: ["transform-runtime"],
                        cacheDirectory: true,
                        // CommonJS规范的使用sourceType: "script"
                        sourceType: "script"
                    }
                }
            ],
        },
        {
            test: /(ESModule|index)\.js$/,
            exclude: /node_modules/,
            use: [
                {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            [
                                "env",
                                {
                                    modules: false
                                }
                            ],
                            "stage-2",
                        ],
                        plugins: ["transform-runtime"],
                        cacheDirectory: true,
                        // ES规范的使用sourceType: "module"（默认值）
                        sourceType: "module"
                    },
                }
            ],
        }
    ]
},
```
