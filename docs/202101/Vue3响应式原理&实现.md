# Vue3 响应式实现

## Vue3 composition-api

[链接做了一夜动画，就为让大家更好的理解 Vue3 的 Composition Api](https://juejin.cn/post/6890545920883032071)

### 1. reactive

最基础的创建响应式数据的 api--reactive
reactive(obj) 就是 Vue2.x 中的 Vue.observable(obj)，将一个普通对象转换为 响应式对象
![image.png](https://cdn.nlark.com/yuque/0/2020/png/696944/1607998968342-c91b4f6a-3b03-4937-bbfe-cbc7c90dd0b4.png#align=left&display=inline&height=194&margin=%5Bobject%20Object%5D&name=image.png&originHeight=194&originWidth=764&size=15809&status=done&style=none&width=764)

#### reactive 和 vue2.observable 的区别

> 题外话：如何让 vue3 和 vue2 并存

+ 应用级别共存，安装两个版本的 vue，不同应用使用不同 api

```bash
npm i vue2@npm:vue@latest
npm i vue3@npm:vue@next
```

+ 组件级别共存：
  + 使用抹平库将 vue2 和 vue3 的 api 互相转换：[https://github.com/privatenumber/vue-2-3](https://github.com/privatenumber/vue-2-3)
  + 在 vue2 中使用 composition-api:
        > 题外话：vue3 相比 vue2，整体大小是增加了，但是在 tress-shaking 的作用下，会变小

![image.png](https://cdn.nlark.com/yuque/0/2020/png/696944/1608011629953-243da2cf-d149-40c0-aff4-c0641234d66f.png#align=left&display=inline&height=240&margin=%5Bobject%20Object%5D&name=image.png&originHeight=312&originWidth=693&size=39299&status=done&style=none&width=534)
写个例子对比下：

```typescript
import vue2 from 'vue2';
import { reactive } from 'vue3'; // vue3没有默认导出

const obj = { a: 1 };
const data = vue2.observable(obj);
console.warn('is vue2.observable return itself', data === obj, data, obj);

const obj3 = { a: 1 };
const proxy = reactive(obj3);
console.warn('is vue3.reactive return itself', proxy === obj3, proxy, obj3);
```

#### reactive 使用

首先来看下，Vue 官方文档中，对于 composition-api 的介绍的最简单的例子：
![image.png](https://cdn.nlark.com/yuque/0/2020/png/696944/1608004604057-bcad0a6d-f3d7-4aec-b4b2-503bac4c8b2d.png#align=left&display=inline&height=268&margin=%5Bobject%20Object%5D&name=image.png&originHeight=268&originWidth=772&size=22961&status=done&style=none&width=772)

1. 调用 reactive：构建 1 个响应式对象，基于之前的了解，这里应该是用 Proxy 劫持了对象的 get、set
2. reactive 时对 state 定义：在 get 中做“副作用”的收集，然后在 set 中取出来，并“消费”这些“副作用”
3. 调用 watchEffect：注册 1 个副作用，并在注册的同时触发 state 的 get

#### reactive 思路

![image.png](https://cdn.nlark.com/yuque/0/2020/png/696944/1608129062223-f67b04b4-1328-4523-a46b-75a8e4538505.png#align=left&display=inline&height=428&margin=%5Bobject%20Object%5D&name=image.png&originHeight=428&originWidth=729&size=33304&status=done&style=none&width=729)

```typescript
export function reactive(target: any) {
    if (isReactive(target)) {
        return target;
    }
    return createReactiveObj(target);
}

export function isReactive(target: any) {
    return !!target.__isRective;
}

export function createReactiveObj(target: any) {
    const proxy = new Proxy(target, {
        get(target, key, receiver) {
            const res = Reflect.get(target, key, receiver);
            // 先占个坑位
            // track(target, 'get', key)
            return res;
        },
        set(target, key, value, receiver) {
            const oldValue = target[key];
            const hadKey = Object.prototype.hasOwnProperty.call(target, key);
            const result = Reflect.set(target, key, value, receiver);
            if (!hadKey) {
                // 先占个坑位
                trigger(target, 'add', key, value);
            } else if (oldValue !== value) {
                // 先占个坑位
                trigger(target, 'set', key, value, oldValue);
            }
            return result;
        },
    });
    proxy.__isRective = true;
    return proxy;
}
```

### 2. effect

在函数式编程的语境中，这个 effect 可以理解为副作用。
可以这么理解：修改了某个数据，但是触发了视图更新，这不是修改数据的预期。

#### watchEffect

![image.png](https://cdn.nlark.com/yuque/0/2020/png/696944/1608004604057-bcad0a6d-f3d7-4aec-b4b2-503bac4c8b2d.png#align=left&display=inline&height=268&margin=%5Bobject%20Object%5D&name=image.png&originHeight=268&originWidth=772&size=22961&status=done&style=none&width=772)

1. watchEffect 观察一个 effect，调用 effect
2. effect 先标记当前 effect 为 activeEffect，然后调用 fn
3. 在 fn 执行过程中，会触发 fn 中 reactive 化对象的 get
4. 在 get 中调用 track，track 函数中收集 effect ，要收集的 effect 就是步骤 2 中的 activeEffect，并存储到对应 target[key] 的 effect 中

#### effect 收集

![image.png](https://cdn.nlark.com/yuque/0/2020/png/696944/1608129769908-ec330dd1-f600-46b8-8e75-1aa0b58adc5c.png#align=left&display=inline&height=492&margin=%5Bobject%20Object%5D&name=image.png&originHeight=492&originWidth=1328&size=73292&status=done&style=none&width=1328)

```typescript
// ReactiveEffect是一个函数对象
export interface ReactiveEffect<T = any> {
    (): T;
    id: number;
    deps: Array<Dep>;
}

export function effect<T = any>(fn: () => T): ReactiveEffect<T> {
    const effect = createReactiveEffect(fn);
    effect();
    return effect;
}

let activeEffect: ReactiveEffect | null;

function createReactiveEffect<T = any>(fn: () => T): ReactiveEffect<T> {
    const effect = function reactiveEffect() {
        try {
            // fn调用有可能触发reactive对象的get，进track，在track里需要将 设置target track 此effect（activeEffect）
            activeEffect = effect;
            // 执行effect(fn)传入的预期有副作用的函数
            return fn();
        } finally {
            activeEffect = null;
        }
    } as ReactiveEffect;
    effect.deps = [];
    effect.id = uuid++;
    return effect;
}

// ReactiveEffect的集合
type Dep = Set<ReactiveEffect>;
// Target每个key所依赖的Dep
type KeyToDepMap = Map<any, Dep>;
// 依赖收集的缓存
const targetMap = new WeakMap<any, KeyToDepMap>();

export function track(target: any, type: string, key: string | number | symbol) {
    if (!activeEffect) {
        return;
    }
    let targetAllKeyDepsMap = targetMap.get(target);
    if (!targetAllKeyDepsMap) {
        targetMap.set(target, (targetAllKeyDepsMap = new Map()));
    }
    let keyDepsSet = targetAllKeyDepsMap.get(key);
    if (!keyDepsSet) {
        targetAllKeyDepsMap.set(key, (keyDepsSet = new Set()));
    }
    const dep = keyDepsSet;
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect);
        activeEffect.deps.push(dep);
    }
}
```

#### targetsMap 的数据结构

![image.png](https://cdn.nlark.com/yuque/0/2020/png/696944/1608135820559-69b036b6-9f7c-4ee4-b525-cbbc99f4e822.png#align=left&display=inline&height=697&margin=%5Bobject%20Object%5D&name=image.png&originHeight=697&originWidth=747&size=64752&status=done&style=none&width=747)

到这里为止，我们就已经实现了一个简易的响应式方案；

1. reactive 劫持
2. effect 收集依赖的 effect

之后，只要 reactive 对象中某个 key 改变了，就会触发 set，那么在 set 中又是如何处理依赖的 effect 呢？

> 到这里都能想到的：通过 target 和 key 取出所有 effect，然后遍历执行即可

#### effect 消费

![image.png](https://cdn.nlark.com/yuque/0/2020/png/696944/1608130703485-e92a4a68-aaee-41ec-9c4c-7ec54b5330b7.png#align=left&display=inline&height=574&margin=%5Bobject%20Object%5D&name=image.png&originHeight=574&originWidth=1305&size=88942&status=done&style=none&width=1305)

```typescript
export function trigger(target: any, type: string, key: string | number | symbol, value: any, oldVale?: any) {
    // 在之前get前端收集到的target到effect的依赖
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        return;
    }
    if (!key) return;
    // 所有需要消费执行的effect
    const effects = new Set<ReactiveEffect>();
    const effectsToAdd = depsMap.get(key);
    if (effectsToAdd) {
        effectsToAdd.forEach(effect => {
            effects.add(effect);
        });
    }

    effects.forEach((effect: ReactiveEffect) => {
        effect();
    });
}
```

#### 为什么要使用 WeakMap？

当 proxy 代理的 key 是对象时，如果用 Map，会导致 target 没法被 GC 回收。测试代码如下

```bash
// 允许手动执行垃圾回收机制
node --expose-gc

global.gc();
// 返回 Nodejs 的内存占用情况，单位是 bytes
process.memoryUsage(); // heapUsed: 4640360 ≈ 4.4M

let map = new Map();
let key = new Array(5 * 1024 * 1024);
map.set(key, 1);
global.gc();
process.memoryUsage(); // heapUsed: 46751472 注意这里大约是 44.6M

key = null;
global.gc();
process.memoryUsage(); // heapUsed: 46754648 ≈ 44.6M

// 这句话其实是无用的，因为 key 已经是 null 了
map.delete(key);
global.gc();
process.memoryUsage(); // heapUsed: 46755856 ≈ 44.6M
```

#### 为什么要使用 Reflect 做 value 的读写操作？

[https://developer.mozilla.org/zh-cn/docs/web/javascript/reference/global_objects/reflect](https://developer.mozilla.org/zh-cn/docs/web/javascript/reference/global_objects/reflect)

1. ES 标准趋势：将 Object 对象的一些明显属于语言内部的方法（比如 Object.defineProperty ），放到 Reflect 对象上；
2. Reflect.set(target, key, val, receiver); 如果出错不会报异常，而是返回 false，同步栈的代码可以继续运行；
3. Reflect 对象的方法与 Proxy 对象的方法一一对应，用 Proxy 的 api 搞的事情，Reflect 都有对应的实现；

#### 没有暴露 effect 的 api，什么时候调用了 effect？

![image.png](https://cdn.nlark.com/yuque/0/2020/png/696944/1608018152813-13e83b51-e978-4639-861b-89efa3905fdb.png#align=left&display=inline&height=1700&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1700&originWidth=3262&size=714874&status=done&style=none&width=3262)

### 3. 实战看看？

```typescript
import { effect, reactive } from './vue';

// vue3 的 reactive
const obj3 = { count: 1 };
const proxy = reactive(obj3);

console.warn('is reactive return itself', proxy === obj3, proxy, obj3);
console.warn('is reactive return itself', proxy === obj3, proxy, obj3);
obj3.count = 2;
console.log('obj3.count = 2 then obj3.count ', obj3.count);
console.log('obj3.count = 2 then proxy.count ', proxy.count);
effect(() => {
    console.warn('业务原始effect调用');
    document.body.innerHTML = `proxy.count is ${proxy.count}`;
});
setTimeout(() => {
    proxy.count = 999;
}, 3000);
```

![image.png](https://cdn.nlark.com/yuque/0/2020/png/696944/1608133086050-a532e555-66df-4ddd-bc29-3a4f223fee1a.png#align=left&display=inline&height=855&margin=%5Bobject%20Object%5D&name=image.png&originHeight=855&originWidth=1258&size=176868&status=done&style=none&width=1258)

#### 对比 vue3 源码

官网仓库：[https://github.com/vuejs/vue-next](https://github.com/vuejs/vue-next)
![image.png](https://cdn.nlark.com/yuque/0/2020/png/696944/1608131907695-b3cba230-4ee8-4208-8fc0-ec284c3d59c1.png#align=left&display=inline&height=331&margin=%5Bobject%20Object%5D&name=image.png&originHeight=331&originWidth=599&size=439356&status=done&style=none&width=599)
以下场景没有考虑：

1. effect 中再调用 effect 的情况: effect(() => {  state.count = 2; effect(() => { document.body.innerHtml}) })
2. effect 中既触发 get 又触发 set 的情况：state.count++
3. reactive 对象中出现循环引用
4. reactive 没有实现深度收集依赖

#### 高效阅读源码的一种方式：单测大法

对于 Vue3 这种完善的项目，单测的覆盖率是可以信任的，如果有某段代码看不懂，可以尝试如下步骤

1. 注释/修改该段代码
2. 运行对应源码文件的 单元测试用例
3. 找到失败的用例，看看是哪些场景下会有问题

![image.png](https://cdn.nlark.com/yuque/0/2020/png/696944/1608133659231-ca92ebe0-7b6e-4454-9b34-d4925322b23c.png#align=left&display=inline&height=693&margin=%5Bobject%20Object%5D&name=image.png&originHeight=693&originWidth=989&size=137027&status=done&style=none&width=989)
注释掉 cleanup(effect);
![image.png](https://cdn.nlark.com/yuque/0/2020/png/696944/1608134004487-b661a8da-a70f-4e2c-90c3-f1d3b76f6556.png#align=left&display=inline&height=528&margin=%5Bobject%20Object%5D&name=image.png&originHeight=528&originWidth=1387&size=106764&status=done&style=none&width=1387)
运行结果：
![image.png](https://cdn.nlark.com/yuque/0/2020/png/696944/1608133941915-f7cac6dd-d4ad-4023-b4cd-41909d21e1df.png#align=left&display=inline&height=1083&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1083&originWidth=1377&size=266712&status=done&style=none&width=1377)

### 4. ref

reactive 的入参必须是 非原始基础类型（string | number | undefined | null）
![image.png](https://cdn.nlark.com/yuque/0/2020/png/696944/1608134039255-a1b4daad-f001-448f-b33b-882197df64e3.png#align=left&display=inline&height=270&margin=%5Bobject%20Object%5D&name=image.png&originHeight=270&originWidth=500&size=14042&status=done&style=none&width=500)
所以这里引出 1 个问题：
computed 这个 API 要怎么实现？ ---- 答案是 “包一层”;

1. 用 Class 包装一层
2. 只暴露 value 的属性，简化用户理解，也防止其他意外
3. 内部调用 track 和 trigger 处理响应式逻辑

```typescript
export function ref(value: any) {
    return new RefImpl(rawValue);
}

class RefImpl<T> {
    private _value: T;

    public readonly __v_isRef = true;

    constructor(private _rawValue: T) {
        this._value = convert(_rawValue);
    }

    get value() {
        track(this, 'get', 'value');
        return this._value;
    }

    set value(newVal) {
        if (hasChanged(newVal, this._rawValue)) {
            this._rawValue = newVal;
            this._value = convert(newVal);
            trigger(this, 'set', 'value', newVal);
        }
    }
}

const convert = <T extends unknown>(val: T): T => (isObject(val) ? reactive(val) : val);
```

```typescript
const count = ref(0);
console.log(count.value); // 0

count.value++;
console.log(count.value); // 1
```

#### ref 和 reactive 对比

[https://vue-composition-api-rfc.netlify.app/zh/#ref-vs-reactive](https://vue-composition-api-rfc.netlify.app/zh/#ref-vs-reactive)

### 5. vue3 与 vue2 响应式差异

[https://cn.vuejs.org/v2/guide/reactivity.html](https://cn.vuejs.org/v2/guide/reactivity.html)

1. 不需要在 reactive 的时候做 for ( const key in obj);
1. 不需要对数组和对象做过多处理

### 6. 对比 react-hook

![image.png](https://cdn.nlark.com/yuque/0/2020/png/696944/1608173114088-534d032a-2c36-48fb-91b3-ae71411cec4d.png#align=left&display=inline&height=402&margin=%5Bobject%20Object%5D&name=image.png&originHeight=402&originWidth=716&size=36449&status=done&style=none&width=716)

[https://github.com/alibaba/hooks](https://github.com/alibaba/hooks)

## Refenence

+ [1] Vue 官方组合式 API 的 RFC [https://vue-composition-api-rfc.netlify.app/zh/](https://vue-composition-api-rfc.netlify.app/zh/#%E8%AE%BE%E8%AE%A1%E7%BB%86%E8%8A%82)
+ [2] ES6 系列之 WeakMap: [https://segmentfault.com/a/1190000015774465](https://segmentfault.com/a/1190000015774465)
+ [3] Vue 源码分析: [https://juejin.cn/post/6898750262614163470](https://juejin.cn/post/6898750262614163470))
