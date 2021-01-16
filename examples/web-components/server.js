const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');

const MIMETYPE = {
    js: 'text/javascript',
    'js.map': 'text/javascript',
    html: 'text/html',
    css: 'text/css',
};

http.createServer((req, res) => {
    const reqUrl = url.parse(req.url);
    console.log(req.url);
    const pathname = reqUrl.pathname;

    if (/(js|html|js\.map|css)$/.test(req.url)) {
        const filepath = path.resolve(__dirname, pathname.substr(1));
        const fileSuffix = filepath.match(/.*?\.(js|html|js\.map|css)$/)[1];
        // 从文件系统中读取请求的文件内容
        fs.readFile(filepath, { encoding: 'utf-8' }, (err, data) => {
            if (err) {
                console.log(err);
                // HTTP 状态码: 404 : NOT FOUND
                // Content Type: text/html
                res.writeHead(404, { 'Content-Type': 'text/html' });
            } else {
                // HTTP 状态码: 200 : OK
                // Content Type: text/html
                res.writeHead(200, { 'Content-Type': MIMETYPE[fileSuffix] + ';charset=utf-8' });

                // 响应文件内容
                res.write(data.toString());
            }
            //  发送响应数据
            res.end();
        });
        return;
    }
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end();
}).listen(8888);
