# 爬虫

一般来说，就抓取网页整个过程我们需要这 3 类工具

- 页面请求工具
- 页面处理工具
- 请求代理&监控工具

笔者主要做前端开发，因此主要介绍 JS 中常见的工具。

## 一、页面请求工具

本质上这些工具都是一个 `网络资源请求` 工具。NodeJS 技术栈中，常见的工具有

### 1. request

最基础的请求库，提供链式语法的 API，喜欢 Promise 的可以试试 `request-promise`
[官方Github 地址](https://github.com/request/request#readme)

```javascript
var request = require("request");
request("https://www.zhihu.com", function(error, response, body) {
  console.log("body:", body); // Print the HTML
});
```

### 2. superagent

原生支持 Node 环境和浏览器环境，提供链式语法和 Promise 语法的 API，周边插件也很丰富
[官方Github 地址](https://github.com/visionmedia/superagent)

```javascript
// Node环境中
const superagent = require("superagent");
superagent
  .get("https://www.zhihu.com") // 请求地址
  .query({ user: "liukanshan" }) // 请求页面或接口的参数
  .end((err, res) => {
    // res是返回体，res.text就是html文本，更多查看官方文档
  });
```

## 二、页面处理工具

抓取到的页面一般是个字符串（"<html>...</html>"），想要 `读取里面的数据`，比如获取导航栏菜单的名称，一般会用到页面模拟工具，常见的工具有

### 1. cheerio

类 JQuey 设计的服务端页面运行环境，以上面 request 请求到页面后为例
[官方Github 地址](https://github.com/cheeriojs/cheerio)

```javascript
var request = require("request");
var cheerio = require("cheerio");
request("https://www.zhihu.com", function(error, response, body) {
  var $ = cheerio.load(body);
  console.log($(".Tabs-link.AppHeader-TabsLink").text); // 打印出 '首页'
});
```

### 2. puppeteer

以 Chromium 为基础开发的 Node 端无头浏览器，最近几年比较火，非常强大，非常强大，非常强大（说三遍～）[官方Github 地址](https://github.com/puppeteer/puppeteer)

实际上，在puppeteer中的环境中，我们模拟任何实际用户的真实操作，所以它更多地被用于一些加密防护措施比较严格的场景

```javascript
const puppeteer = require("puppeteer");
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://zhihu.com");
  await page.screenshot({ path: "知乎首页截图打印成图片.png" });
  await browser.close();
})();
```

## 三、抓取代理工具

我们在调试 “抓取网页” 这个过程时，需要经常查看我们发出的请求对不对，返回是否有异常等，这时候需要代理工具能`查看网络请求和返回`

### whistle

基于 NodeJS 开发网络代理工具

详情见 [官网](https://github.com/avwo/whistle)
