module.exports = {
    home: true,
    title: '前路漫漫',
    description: '前路漫漫 当克己 当慎独',
    plugins: [
        [
            '@vuepress/active-header-links',
            {
                sidebarLinkSelector: '.sidebar-link',
                headerAnchorSelector: '.header-anchor',
            },
        ],
        '@vuepress/nprogress',
        '@vuepress/medium-zoom',
        '@vuepress/last-updated',
        '@vuepress/back-to-top',
    ],
    themeConfig: {
        logo: '/assets/images/logo.png',
        // 最后更新时间
        lastUpdated: '最后更新',
        // 顺滑滚动
        smoothScroll: true,
        // GitHub仓库名称
        repo: 'SmileSmith/Blogs',
        // 自定义仓库链接文字。
        repoLabel: 'Github',
        // 假如文档不是放在仓库的根目录下：
        docsDir: 'docs',
        // 设置为 true 来启用
        editLinks: true,
        // 默认为 "Edit this page"
        editLinkText: '帮助改善此页面！',
        // 顶部导航
        nav: [
            // 添加导航栏
            { text: '所有博客', link: '/' },
            { text: '个人网站', link: 'http://gofrontend.cn' },
        ],
        displayAllHeaders: true,
        // 根据md标题自动添加侧边栏
        sidebar: 'auto',
        // 识别到H3，也就是###
        sidebarDepth: 3,
    },
};
