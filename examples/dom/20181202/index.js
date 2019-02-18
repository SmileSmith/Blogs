

(function() {
    /**
     * 1. 调用异步jsonp请求
     * 2. 同时执行location.href跳转
     * 
     * 页面跳转，jsonp请求被aborted，script
     * Android中script.onerror不会执行
     * IOS中script.onerror会执行
     */
    jsonp({
        url: 'http://www.baidu.com?jsonCallback=aaa',
        dataType: 'jsonp',
        error (result) {
            alert(result);
        },
        success () {
            alert('request success');
        },
    });
    // 调用异步jsonp时，页面跳转
    location.href = '//www.weibo.com';
})();


/**
 * 简易的jsonp实现
 *
 * @param {*} options
 * @returns
 */
function jsonp (options) {
    var responseData;
    var callbackName = options.url.match(/jsonCallback=([\w\d]*)/)[1];
    var isTimeout;
    function abort () {
        isTimeout = true;
        options.error(null, 'timeout', xhr, options);
    }
    var script = document.createElement('script');
    script.encoding = 'utf-8';
    // eslint-disable-next-line
    script.onload = function (e, errorType) {
        if (isTimeout) {
            return false;
        }
        alert('load' + e.type);
        if (e.type == 'error') {
            options.error('jsonp error');
        } else if (!responseData) {
            options.error('jsonp dont return');
        } else {
            options.success('jsonp success');
        }

        script.parentNode && script.parentNode.removeChild(script);
    };
    script.onerror = function (e, errorType) {
        if (isTimeout) {
            return false;
        }
        alert('error' + e.type);
        if (e.type == 'error') {
            options.error('jsonp error');
        } else if (!responseData) {
            options.error('jsonp dont return');
        } else {
            options.success('jsonp success');
        }

        script.parentNode && script.parentNode.removeChild(script);
    };
    script.src = options.url;

    window[callbackName] = () => {
        responseData = arguments;
    };
    setTimeout(abort, 10 * 1000);
    document.head.appendChild(script);
    var xhr = { abort }
    return xhr;
}




/**
 * Promise版
 *
 * @param {*} options
 * @returns
 */
function jsonpPromise (options) {
    return new Promise(function (resolve, reject) {
        if (!options) {
            reject();
            return;
        }
        options.success = function (result) {
            try {
                resolve({ body: result });
            } catch (e) {
                reject({ code: 999, message: e });
            }
        };
        options.error = function (err) {
            reject(err);
        };
        jsonp(options);
    });
}


