export const works = [
    {
        id: 'operating-system-notes',
        section: 'blog',
        title: '操作系统',
        href: 'content/blog/operating-system.html',
        date: '课程笔记',
        summary: '课程笔记与核心概念整理，适合按知识点快速回看。',
        tags: ['系统', '课程笔记']
    },
    {
        id: 'database-notes',
        section: 'blog',
        title: '数据库',
        href: 'content/blog/database.html',
        date: '课程笔记',
        summary: '数据库课程中的模型、查询、事务与系统实现要点。',
        tags: ['数据库', 'SQL', '课程笔记']
    },
    {
        id: 'internet-computing-notes',
        section: 'blog',
        title: '互联网计算',
        href: 'content/blog/internet-computing.html',
        date: '课程笔记',
        summary: '围绕互联网系统、协议与计算模式的学习记录。',
        tags: ['互联网计算', 'Web', '课程笔记']
    },
    {
        id: 'compiler-principles-notes',
        section: 'blog',
        title: '编译原理',
        href: 'content/blog/compiler-principles.html',
        date: '课程笔记',
        summary: '从词法、语法到中间表示的编译原理笔记。',
        tags: ['编译原理', '语言', '课程笔记']
    },
    {
        id: 'software-major',
        section: 'articles',
        title: '关于填报软件工程专业的一些看法',
        kind: 'html',
        source: 'content/articles-html/software-major.html',
        date: '2026',
        summary: '从专业定位、就业去向和报考建议聊软件工程是否适合你。',
        tags: ['专业选择', '长文'],
        featured: true,
        featuredOrder: 2
    },
    {
        id: 'mamba-paper-reading',
        section: 'articles',
        title: 'Mamba 论文阅读：选择性状态空间模型如何挑战 Transformer',
        kind: 'html',
        source: 'content/articles-html/mamba-paper-reading.html',
        date: '2026',
        summary: '从 SSM 的长期记忆问题，到 Mamba 的选择性机制与硬件感知扫描。',
        tags: ['论文阅读', '大模型', 'SSM'],
        featured: true,
        featuredOrder: 1
    },
    { id: 'shang-yuan', section: 'poem', title: '上元', kind: 'markdown-poem', source: 'content/poem-essay/上元.md' },
    { id: 'first-arrival-jiangning', section: 'poem', title: '初到江宁', kind: 'markdown-poem', source: 'content/poem-essay/初到江宁.md', summary: '初到江宁时写下的一首短诗，记一点新地与新心绪。', tags: ['诗词', '江宁'], featured: true, featuredOrder: 3 },
    { id: 'three-kingdoms', section: 'poem', title: '叹三国', kind: 'markdown-poem', source: 'content/poem-essay/叹三国.md' },
    { id: 'summer-thoughts', section: 'poem', title: '夏日咏怀', kind: 'markdown-poem', source: 'content/poem-essay/夏日咏怀.md' },
    { id: 'night-boat-home', section: 'poem', title: '夜行舟归家', kind: 'markdown-poem', source: 'content/poem-essay/夜行舟归家.md' },
    { id: 'rumengling-mid-autumn', section: 'poem', title: '如梦令·中秋', kind: 'markdown-poem', source: 'content/poem-essay/如梦令·中秋.md' },
    { id: 'cold-night-family', section: 'poem', title: '寒夜怀亲', kind: 'markdown-poem', source: 'content/poem-essay/寒夜怀亲.md' },
    { id: 'untitled-mid-autumn', section: 'poem', title: '无题', kind: 'markdown-poem', source: 'content/poem-essay/无题.md' },
    { id: 'spring-tea', section: 'poem', title: '春茶', kind: 'markdown-poem', source: 'content/poem-essay/春茶.md', date: '2022春末', summary: '以春茶、风雨与旧枝新花写一段清寒里的生意。', tags: ['诗词', '春', '校园'] },
    { id: 'moonlit-hometown', section: 'poem', title: '月夜怀乡', kind: 'markdown-poem', source: 'content/poem-essay/月夜怀乡.md' },
    { id: 'wutong-shadow', section: 'poem', title: '梧桐影', kind: 'markdown-poem', source: 'content/poem-essay/梧桐影.md' },
    { id: 'taihang-north', section: 'poem', title: '登临太行北望', kind: 'markdown-poem', source: 'content/poem-essay/登临太行北望.md' },
    { id: 'yellow-river', section: 'poem', title: '登黄河古迹怀古', kind: 'markdown-poem', source: 'content/poem-essay/登黄河古迹怀古.md', summary: '登临古迹时的历史感、山河感与怀古心绪。', tags: ['诗词', '怀古', '山河'] },
    { id: 'kitchen-god-snow', section: 'poem', title: '祭灶遇风雪', kind: 'markdown-poem', source: 'content/poem-essay/祭灶遇风雪.md' },
    { id: 'red-beans', section: 'poem', title: '红豆', kind: 'markdown-poem', source: 'content/poem-essay/红豆.md' },
    { id: 'tiger-year', section: 'poem', title: '虎年', kind: 'markdown-poem', source: 'content/poem-essay/虎年.md' },
    { id: 'after-exam', section: 'poem', title: '试后述志', kind: 'markdown-poem', source: 'content/poem-essay/试后述志.md' },
    { id: 'caisangzi-snow', section: 'poem', title: '采桑子·咏雪', kind: 'markdown-poem', source: 'content/poem-essay/采桑子·咏雪.md' },
    { id: 'qingyuan-birthday', section: 'poem', title: '青玉案·添岁有感', kind: 'markdown-poem', source: 'content/poem-essay/青玉案·添岁有感.md' },
    { id: 'zhegutian-dongge-dream', section: 'poem', title: '鹧鸪天·东阁记梦', kind: 'markdown-poem', source: 'content/poem-essay/鹧鸪天·东阁记梦.md' },
    { id: 'zhegutian-gray-hair', section: 'poem', title: '鹧鸪天·华发叹', kind: 'markdown-poem', source: 'content/poem-essay/鹧鸪天·华发叹.md' },
    {
        id: 'spring-essay',
        section: 'articles',
        title: '浅谈“春”',
        kind: 'html',
        source: 'content/print/spring-essay.html',
        summary: '一篇关于春天意象与个人感受的短文。',
        tags: ['散文', '春', '文学']
    }
];

export const workSections = [
    { id: 'blog', title: 'Blog', open: false },
    { id: 'poem', title: 'Poem', open: false },
    { id: 'articles', title: 'Articles', open: false }
];
