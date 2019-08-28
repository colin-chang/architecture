module.exports = {
    title: '分布式系统架构设计',
    description: '分布式系统架构设计',
    base: '/architecture/',
    head: [
        ['link', {
            rel: 'icon',
            href: '/favicon.ico'
        }]
    ],
    plugins: [
        '@vuepress/active-header-links',
        '@vuepress/back-to-top',
        ['@vuepress/google-analytics', {
            ga: 'UA-131744342-1'
        }]
    ],
    themeConfig: {
        repo: 'https://github.com/colin-chang/architecture',
        nav: [{
                text: 'Get Start',
                link: '/architecture/intro'
            },
            {
                text: 'Books',
                items: [{
                        text: 'Python',
                        link: 'https://colin-chang.site/python/'
                    },
                    {
                        text: '.Net Core',
                        link: 'https://colin-chang.site/netcore/'
                    },
                    {
                        text: 'Linux',
                        link: 'https://colin-chang.site/linux/'
                    }
                ]
            },
            {
                text: 'Blog',
                link: 'https://colin-chang.site/'
            }
        ],
        sidebar: [{
                title: '系统架构',
                collapsable: false,
                children: [
                    '/architecture/intro',
                ]
            },{
                title: '数据库优化',
                collapsable: false,
                children: [
                    '/database/lock',
                ]
            },
            {
                title: 'NoSQL',
                collapsable: false,
                children: [
                    '/nosql/intro',
                    '/nosql/redis',
                    '/nosql/mongo'
                ]
            },
            {
                title: '分布式日志',
                collapsable: false,
                children: [
                    '/log/elk',
                    '/log/exceptionless',
                ]
            },
            {
                title: 'TODO',
                collapsable: false,
                children: [
                    '/todo'
                ]
            },
        ],
        displayAllHeaders: true,
        lastUpdated: '更新时间',
    },
    markdown: {
        lineNumbers: true
    }
}