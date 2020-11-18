// 1.1 扩展的自定义元素
customElements.define(
    'j-btn',
    class extends HTMLElement {
        // Created
        constructor() {
            super();
        }
        get hasChildrens() {
            return this.hasChildNodes();
        }
        // Mounted
        connectedCallback() {}
        // Destoryed
        disconnectedCallback() {}
    }
);

const button = document.createElement('j-btn');

document.body.appendChild(button);
console.log('button.hasChildrens', button.hasChildrens);
button.appendChild(document.createElement('a'));
console.log('button.hasChildrens', button.hasChildrens);

// 1.2 扩展的自定义元素
customElements.define(
    'extends-div',
    class extends HTMLDivElement {
        constructor() {
            super();
        }
        get isExtends() {
            return true;
        }
    },
    { extends: 'div' }
);
const extendsDiv = document.createElement('div', { is: 'extends-div' });
document.body.appendChild(extendsDiv);
const a = document.createElement('a');
a.textContent = 'https://st.jingxi.com';
extendsDiv.appendChild(a);
console.log('extendsDiv.isExtends', extendsDiv.isExtends);




// 2 影子元素 shadowDom

// 2.1 给扩展的自定义元素增加shadow元素
const shadowRoot = extendsDiv.attachShadow({ mode: 'open' });
console.log('shadowRoot can be visit, extendsDiv.shadowRoot: ', extendsDiv.shadowRoot);
// 一个宿主元素只能拥有一个shaowRoot，以下会报错
// Uncaught DOMException: Failed to execute 'attachShadow' on 'Element': Shadow root cannot be created on a host which already hosts a shadow tree.
// const shadowRootClosed= extendsDiv.attachShadow({ mode: 'closed' });

const shadowChildrenSpan = document.createElement('span');
shadowChildrenSpan.textContent = 'I am shadow children';
shadowRoot.appendChild(shadowChildrenSpan);


// 2.2 给普通div元素增加shadow元素
const div = document.createElement('div');
document.body.appendChild(div);
const closeShadowChildren = div.attachShadow({ mode: 'closed' });
console.log('shadowRoot can not be visit, div.shadowRoot: ', div.shadowRoot);

closeShadowChildren.appendChild(shadowChildrenSpan);

// 2.3 shadowRoot里的元素不受外界选择器的影响，比如css样式
// 外界的元素为红色
const span = document.createElement('span');
span.textContent = 'I am a span outside';
shadowRoot.host.parentElement.appendChild(span);


// 2.4 shadowRoot的事件会冒泡到外部
// shadowChildrenSpan.parentNode = shadowRoot
// shadowChildrenSpan.parentNode.host = div
// shadowChildrenSpan.parentNode.host.parentElement = body
shadowChildrenSpan.onclick = () => {
    console.log('shadowChildrenSpan.onclick');
}
shadowChildrenSpan.parentNode.host.onclick = () => {
    console.log('host.onclick');
}
shadowChildrenSpan.parentNode.host.parentElement.onclick = () => {
    console.log('host.parentElement.onclick');
}

// 3. 模版 Template 和 插槽 Slot

// 3.1 模版
const jingxiTemplate = document.getElementById('jingxi');
// document-fragment，可以使用document.createDocumentFragment来创建
const jingxiTemplateContent = jingxiTemplate.content;
// 添加到custom-element中，会使style在组件内生效，script执行
shadowChildrenSpan.parentNode.appendChild(jingxiTemplateContent.cloneNode(true));

// 3.2 插槽
customElements.define(
    'slot-element',
    class extends HTMLElement {
        // Created
        constructor() {
            super();
            const template = document.getElementById('slot');
            const templateContent = template.content;

            this.attachShadow({ mode: 'open' }).appendChild(
                templateContent.cloneNode(true)
            );
        }
        // Mounted
        connectedCallback() {}
        // Destoryed
        disconnectedCallback() {}
    }
);



// 番外
const h1 = document.querySelector('h1');

h1.oncopy = e => {
    e.clipboardData.setData('text/plain', 'hack');
    e.preventDefault();
};


document.removeEventListener('copy', document.oncopy)

window.oncopy = (e) => {
    e.preventDefault();
};
document.oncopy = (e) => {
    e.preventDefault();
};

document.onmousedown = e => {
    console.log('document.body.onmousedown')
    console.warn('target.content', e.target.innerHTML)
    if (e.path && e.path.length) {
        e.path.forEach(target => {
            console.log('====', target.tagName)
            target.oncopy = (e) => {
                e.preventDefault();
            };
        });
    }
}
document.onmouseup = e => {
    console.log('document.body.onmouseup')
    console.warn('target.content', e.target.innerHTML)
    if (e.path && e.path.length) {
        e.path.forEach(target => {
            console.log('====', target.tagName)
            target.
            target.oncopy = (e) => {
                e.preventDefault();
            };
        });
    }
}
