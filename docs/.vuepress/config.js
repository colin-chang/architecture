module.exports = {
    title: '系统架构设计与优化',
    description: '拥抱云时代容器化微服务化系统架构',
    base: '/',
    head: [
        ['link', {
            rel: 'icon',
            href: 'https://cdn.hashnode.com/res/hashnode/image/upload/v1658902565243/IDyIb_63A.png'
        }]
    ],
    plugins: [
        '@vuepress/active-header-links',
        '@vuepress/back-to-top',
        '@vuepress/last-updated',
        '@vuepress/medium-zoom',
        ['@vuepress/google-analytics', {
            ga: 'UA-131744342-1'
        }]
    ],
    themeConfig: {
        logo:'https://s2.loli.net/2022/08/04/UXqgLBVfzPuvb5A.png',
        repo: 'https://github.com/colin-chang/architecture',
        smoothScroll:true,
        search: false,
        algolia: {
            apiKey: '0b50b5acae02c9ea945e9c1e2a8fc88e',
            indexName: 'architecture-nomad',
            appId: 'CQMRGXO6ON'
        },
        nav: [{
                text: 'Get Start',
                link: '/architecture/intro'
            },
            {
                text: 'Books',
                items: [{
                        text: 'Python',
                        link: 'https://python.a-nomad.com'
                    },
                    {
                        text: '.Net',
                        link: 'https://dotnet.a-nomad.com'
                    },
                    {
                        text: 'Linux',
                        link: 'https://linux.a-nomad.com'
                    }
                ]
            },
            {
                text: 'Blog',
                link: 'https://a-nomad.com/'
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
        sidebarDepth:3,
        displayAllHeaders: true,
        lastUpdated: '更新时间',
    },
    markdown: {
        lineNumbers: true
    }
}
