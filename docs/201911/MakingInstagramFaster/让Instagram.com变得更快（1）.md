# 让 Instagram.com 变得更快: 第一章

最近这几年，instagram.com 改版了很多 - 我们在 INS 中加入了 Stories、滤镜、创作工具、系统通知和消息推送等新特性和功能增强。然而，伴随着产品的不断迭代成长，一个不幸的事情发生了：我们的 web 端性能开始下降了。为处理性能下降，在最近的一年中，我们有意识地开展一些工作来提升性能。截止目前，我们的不懈努力已经让 Feed 页面加载时间减少了将近 50%。这个系列的博客文章将会讲述我们为实现这些提升所做的一些工作。

> 译注：
> Stories 是 INS 推出的用到用户用 短视频 记录并分享生活的功能.
> Feed 是将用户主动订阅的若干消息源组合在一起形成内容聚合器. 类似无限滚动的帖子，比如小红书的首页 Feed 流

![近1年中，Feed页渲染完成时间的优化(毫秒)](./images/1_1.png)

正确的资源下载/执行优先级，并减少页面加载期间浏览器的空闲时间，是提升 web 应用性能的最重要手段之一。在我们的 web 应用中，上述类型的优化方案被证明比减少代码大小更为直接有效，因为能够轻易减少代码量一般都比较小，需要多方面持续不断地进行代码量减小，才能看到比较明显的效果（这些将在后续的文章中进行讨论）。并且，上述类型的优化对产品开发节奏的影响比较小，它只需要少量的代码更改和重构。所以一开始，我们先关注在资源预加载方向上的性能提升。

## JavaScript, XHR, and 图片预加载 (和注意点)

一个总的原则是：我们希望尽可能早地让浏览器知道当前页面需要加载哪些资源。作为开发者，我们通常都能预想到页面要加载的所有资源，但是对于浏览器来说，有些资源要在页面加载过程中，它才知道需要加载。比如通过某个 JavaScript 脚本引入的动态依赖的资源（其它脚本、图片、XHR 请求等），浏览器要先等这个 JavaScript 脚本解析并执行完，才能发现这些动态依赖的资源。

比起等待浏览器自己去发现这些要动态加载资源，我们可以给浏览器 1 个提示：“别等了，立即开始预加载这些 XXX 资源”。为实现这个特性，我们用到了 HTML 的预加载标签。它们长这样：

```html
<link rel="preload" href="my-js-file.js" as="script" type="text/javascript" />
```

在 Instagram 中，我们会在关键页面加载中给这两种资源增加「预加载提示」：动态加载的 Javascript、预加载的 XHR-GraphQL 数据请求。动态加载的 Javascript，通常是指那些通过`import('...')`为指定客户端路由加载的脚本。我们维护着 1 个服务端入口文件和客户端路由脚本映射列表 --- 因此，在服务端接收到请求时，我们可以知道这个特定的服务端入口文件将需要哪些客户端路由的动态脚本，并且在页面初始化渲染的 HTML 中，为这些脚本添加预加载逻辑。

举个例子，在 Feed 页的入口文件中，我们知道客户端路由最终会请求 FeedPageContainer.js。所以可以在 HTML 中添加以下代码：

```html
<link
  rel="preload"
  href="/static/FeedPageContainer.js"
  as="script"
  type="text/javascript"
/>
```

类似的，如果我们知道：在某个页面中入口文件中，必然会执行 1 个特定的 GraphQL 请求。那么我们就可以预加载这个 XHR 请求。这个点非常重要，因为在某些场景下 GraphQL 请求会消耗大量时间，页面必须要等到这些数据加载好才能开始渲染。

```html
<link
  rel="preload"
  href="/graphql/query?id=12345"
  as="fetch"
  type="application/json"
/>
```

在弱网络下，页面预加载的优化效果会更明显。在模拟的 fast 3G 网络环境下（下面第一张图中的的 Waterfall），可以看到需要等到 Consumer.js 加载完成后，FeedPageContainer.js 和关联的 GraphQL 请求才开始加载。而在有预加载的情况下，FeedPageContainer.js 和它的 GraphQL 请求可以在 HTML 生效时就开始加载。同样，对于那些不重要的懒加载脚本，预加载优化同样也能减少它们加载的时间（可以在第二张图中 Waterfall 看到）。 比如图二中，FeedSidebarContainer.js 和 ActivityFeedBox.js （被 FeedPageContainer.js 依赖）几乎在 Consumer.js 加载完成的同时就开始加载了。

![没有预加载](./images/1_2.png)

![预加载](./images/1_3.png)

## 调整预加载优先级的好处

除了更早地开始资源加载，预加载还有额外的好处：提升异步脚本加载的网络优先级。对于重要的「异步脚本」来说，这点非常重要，因为它们的网络优先级默认是 low。这意味着它们的优先级和屏幕之外的图片一样（low），而页面的 XHR 请求和屏幕内的图片网络优先级则比它们来得高（high）。这导致页面渲染所需的重要脚本的加载可能被阻塞，或和其它请求共享带宽（如果想了解更多，可以看[这篇关于 Chrome 中资源优先级的深入讨论的文章](https://medium.com/reloading/preload-prefetch-and-priorities-in-chrome-776165961bbf)）。当我们知道那些资源需要被优先加载时，在初始化时，我们可以使用预加载对浏览器的内容加载优先级进行更高层次的控制。但是，谨慎使用（这点将在接下来的一分钟内详细阐述）。

## 调整预加载优先级的问题

预加载的问题是：它提供的额外控制会带来额外的责任：即设置正确的资源优先级。举个例子，当在低速移动网络区域、慢 WIFI 网络或丢包率比较高的场景中测试时，我们发现 `<link rel="preload" as="script">` 的网络请求优先级会比 `<script />` 标签的 JavaScript 脚本来得高，而`<script />` 标签的脚本才是页面渲染首先需要的，这将增加整个页面加载时间。

这个问题源于我们在页面中如何设置预加载的标签。因为我们只为以下条件的 JS 包添加预加载：通过客户端路由当前页面需要异步加载的。

- 只预加载路由需要的异步 JavaScript 包

```html
<!-- 预加载的 异步的路由JS -->
<!-- 译注：先加载，却要等到Common.js和Consumer.js都加载执行完，才开始执行 -->
<link rel="preload" href="SomeConsumerRoute.js" as="script" />
<link rel="preload" href="..." as="script" />
...
<!-- 页面渲染路径上的重要JS -->
<script src="Common.js" type="text/javascript"></script>
<script src="Consumer.js" type="text/javascript"></script>
```

在上述页面的例子中，我们总是在 Common.js 和 Consumer.js 之前先开始加载（预加载） SomeConsumerRoute.js。而预加载的资源有着高网络优先级却不解析和编译，这将阻塞启动 Common.js 和 Consumer.js 的解析和编译。Chrome 的数据分析团队也发现和这类似预加载问题，并给出了他们的[解决方案](https://medium.com/reloading/a-link-rel-preload-analysis-from-the-chrome-data-saver-team-5edf54b08715)。在他们的例子中，他们提出一个优化方案：总是把预加载异步资源的标签放到 script 标签之后。我们使用稍微不同的方案，我们决定对 **所有** JS 资源都使用预加载标签，并将他们按我们的想要的顺序放置。这将确保 1. 我们可以在页面中尽可能早地开始预加载所有资源（包括那些需要特定服务器数据才渲染 HTML 的同步脚本），2. 我们可以控制 JS 资源加载的顺序。

- 预加载所有 JavaScript 包

```html
<!-- 预加载的 页面渲染路径上的重要JS -->
<link rel="preload" href="Common.js" as="script" />
<link rel="preload" href="Consumer.js" as="script" />
<!-- 预加载的 异步的路由JS -->
<link rel="preload" href="SomeConsumerRoute.js" as="script" />
...
<!-- 页面初始化渲染路径上所有JS -->
<script src="Common.js" type="text/javascript"></script>
<script src="Consumer.js" type="text/javascript"></script>
<script src="SomeConsumerRoute.js" type="text/javascript" async></script>
```

## 图片预加载

Feed 页是[instagram.com](instagram.com)的一个重要门面，它由 1 个包含图片和视频的无限滚动的 feed 列表组成。实现方式是：初始化时加载一批 feed 展示给用户，并在用户滚动 Feed 页底部时加载额外 feed。然而，我们不希望用户在每次划到页面的底部都是等待（等待加载新一批的 feed 数据），这点对用户体验来说很重要，所以我们会在用户划到底部之前就加载新一批的数据。

然后这在实际实践中很难做到，原因如下：

- 我们不希望屏幕之外的 feed 占用过多 CPU 和带宽资源（屏幕内、用户正在浏览的 feed 更需要）。
- 我们不希望过多的预加载 feed 浪费用户带宽，这些预加载的 feed 可能用户并不会去浏览。但从另一方面看，如果不预加载足够多的 feed，用户会经常因划到底部而等待。
- [Instagram.com](instagram.com)网站需要适配各种屏幕尺寸和设备。因此我们用 img 的`srcset`属性来展示 feed 的图片（浏览器根据屏幕尺寸和像素密度加载不同资源）。这意味我们不好确定需要预加载的图片资源，并可能带来预加载一些浏览器不需要资源的风险。

我们解决这个问题的方案是：构建一个优先任务的抽象来处理异步加载的队列（在上述例子中，异步加载的队列指下一批要预加载的 feed）。这个预加载任务在初始化时优先级是idle（利用 requestIdleCallback 函数），所以它会到浏览器不执行任何其它的重要任务时才开始。而当用户划动到距离页面底部足够近时，我们会提升这个预加载任务的优先级到‘high’。提升的方式是：通过取消所有待执行的空闲任务，这样预加载任务就能立即执行。

![feed](./images/1_4.png)

当下一批feed的 JSON 数据到达时，我们在队列中的后面，按顺序添加新的图片预加载任务。我们按照帖子的顺序来加载而非并行加载，这样就优先加载和展示那些靠近用户‘视口’feed的图片。为了保证我们预加载正确尺寸的图片，我们利用一个隐藏的预加载组件，它的尺寸和当前 feed 相等。组件内部是一个带 `srcset` 属性 `<img>` 标签，和实际 feed 中 img 保持一致。这意味着我们把不同尺寸大小的图片选择权留给了浏览器，这样在真实的 feed 中，它将执行同样的逻辑，确保选择加载的图片和已经被预加载的图片一致。这也意味着，利用媒体预读取组件，设置和目标资源相等的尺寸，我们可以预读取其它页面中图片 - 比如利用 feed 中的小头像图片，预读取个人简介页中的大头像。

上述优化一共减少了 25%的图片加载时间（这里的图片加载时间指：从 feed 标签被挂载到页面开始，到图片实际加载最终可见的时间），也减少了 65%等待时间（用户耗费在等待下一页内容的时间）。

## 请继续关注第二章

请继续关注第二章：尽早呈现和渐进式 HTML（以及 为什么不必在浏览器资源推送中使用 HTTP/2）。如果您想了解更多有关这项工作的信息，或者有兴趣加入我们的工程团队之一，请访问我们的[公司页面](https://www.facebook.com/careers/jobs/?q=instagram)，关注我们[on Facebook](https://www.facebook.com/instagramengineering/)或者[on Twitter](https://twitter.com/instagrameng).

## 译注

这里再补充一些扩展阅读:

### link标签的preload

这个特性的兼容性其实比较一般，特别是在iPhone中，IOS11之后才支持preload。当然这种属于渐进式的优化，低版本也无影响。

[通过rel="preload"进行内容预加载](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Preloading_content)

### 空闲调用函数

就是上面说到的在浏览器空间时才执行回调的实现，注册IDLE优先级的回调。

[requestIdleCallback](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback)

这个函数的兼容性就更差啦，IOS中全军覆没，因此实际使用时需要polyfill
