# 当script异常时，onerror事件是否要执行

## 背景

在1个JSONP的请求中，如果走到Promise的catch中会兜底返回空数组`[]`的数据兜底，业务得到`[]`后会再次调用jsonp。在IOS环境中出现了死循环。

## 分析

在IOS环境下，即使发生了页面跳转，script的请求被aborted，script的onerror事件还是会执行

复现代码见[jsonp问题复现](./../../examples/dom/20181202)
