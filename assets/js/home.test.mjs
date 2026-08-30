import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { works, workSections } from '../data/works.js';

globalThis.document = {
    getElementById() {
        return null;
    },
    querySelectorAll() {
        return [];
    }
};

const {
    getContactCopyLabel,
    getLibrarySearchStatus,
    getActiveWorkIdFromLocation,
    getArticleTocHeadings,
    applyBaseUrl,
    createFeaturedWorkCard,
    getFeaturedWorks,
    getMusicEmbedUrl,
    getRandomContentItems,
    getRandomContentUrl,
    getLibraryToggleLabel,
    normalizeLibrarySearchQuery,
    normalizeLibraryPanelOpen,
    normalizeLibraryScrollTop,
    navigateToRandomContent,
    getSpotifyPlaylistEmbedUrl,
    resolveLibrarySectionOpen,
    resolveWorkHref
} = await import('./home.js');

test('uses the section default when no saved state exists', () => {
    assert.equal(resolveLibrarySectionOpen({ id: 'blog', open: true }, {}), true);
    assert.equal(resolveLibrarySectionOpen({ id: 'articles', open: false }, {}), false);
});

test('saved state overrides the section default', () => {
    assert.equal(resolveLibrarySectionOpen({ id: 'blog', open: true }, { blog: false }), false);
    assert.equal(resolveLibrarySectionOpen({ id: 'articles', open: false }, { articles: true }), true);
});

test('blog article pages load the library sidebar script', async () => {
    const layout = await readFile(new URL('../../_layouts/blog_article.html', import.meta.url), 'utf8');

    assert.match(layout, /assets\/js\/home\.js/);
});

test('blog article pages rely on the library home link instead of a duplicate back button', async () => {
    const layout = await readFile(new URL('../../_layouts/blog_article.html', import.meta.url), 'utf8');

    assert.doesNotMatch(layout, /Back Home/);
    assert.doesNotMatch(layout, /class="nav-link"/);
});

test('blog article pages reserve a side table of contents instead of placing it before the article', async () => {
    const layout = await readFile(new URL('../../_layouts/blog_article.html', import.meta.url), 'utf8');

    assert.match(layout, /blog-document-layout/);
    assert.match(layout, /id="blog-toc"/);
    assert.ok(layout.indexOf('markdown-document') < layout.indexOf('blog-toc'));
});

test('internet computing note does not render source semester and author as body text', async () => {
    const note = await readFile(new URL('../../content/blog/互联网计算.md', import.meta.url), 'utf8');

    assert.doesNotMatch(note, /^2025年春$/m);
    assert.doesNotMatch(note, /^林圣旋$/m);
});

test('article toc headings are built from h2 and h3 elements only', () => {
    const article = {
        querySelectorAll(selector) {
            assert.equal(selector, 'h2, h3');
            return [
                { id: '', tagName: 'H1', textContent: '跳过' },
                { id: '', tagName: 'H2', textContent: ' 第一章 ' },
                { id: 'custom', tagName: 'H3', textContent: '小节' },
                { id: '', tagName: 'H2', textContent: '   ' }
            ];
        }
    };

    assert.deepEqual(getArticleTocHeadings(article), [
        { id: 'blog-section-1', level: 'h2', title: '第一章' },
        { id: 'custom', level: 'h3', title: '小节' }
    ]);
});

test('library links are rooted so they work from nested pages', () => {
    assert.equal(resolveWorkHref({ href: 'content/blog/operating-system.html' }), '/content/blog/operating-system.html');
    assert.equal(resolveWorkHref({ id: 'spring-essay' }), '/reader.html?work=spring-essay');
});

test('baseurl is applied to rooted and reader URLs', () => {
    assert.equal(applyBaseUrl('/reader.html?work=spring-essay', '/site'), '/site/reader.html?work=spring-essay');
    assert.equal(applyBaseUrl('content/blog/database.html', '/site/'), '/site/content/blog/database.html');
    assert.equal(applyBaseUrl('/content/blog/database.html', ''), '/content/blog/database.html');
});

test('random content pool is empty when no visible content exists', () => {
    const randomItems = getRandomContentItems([
        { section: 'music', href: '/music.html' },
        { section: 'blog', href: 'content/blog/hidden.html', hidden: true },
        { section: 'poem', id: 'draft-poem', draft: true },
        { section: 'articles', id: 'unpublished', published: false }
    ]);

    assert.deepEqual(randomItems, []);
    assert.equal(getRandomContentUrl(randomItems), '');
    assert.equal(navigateToRandomContent(randomItems, { href: '' }), '');
});

test('random content returns the only available URL', () => {
    const randomItems = getRandomContentItems([
        { id: 'single-poem', section: 'poem', title: 'Single Poem' }
    ]);

    assert.equal(randomItems.length, 1);
    assert.equal(getRandomContentUrl(randomItems, () => 0.99), '/reader.html?work=single-poem');
});

test('random content returns a valid URL from multiple items', () => {
    const randomItems = getRandomContentItems([
        { section: 'blog', title: 'Blog', href: 'content/blog/demo.html' },
        { id: 'article-demo', section: 'articles', title: 'Article' },
        { id: 'poem-demo', section: 'poem', title: 'Poem' }
    ]);

    assert.equal(getRandomContentUrl(randomItems, () => 0), '/content/blog/demo.html');
    assert.equal(getRandomContentUrl(randomItems, () => 0.5), '/reader.html?work=article-demo');
    assert.equal(getRandomContentUrl(randomItems, () => 0.99), '/reader.html?work=poem-demo');
});

test('random content pool deduplicates URLs', () => {
    const randomItems = getRandomContentItems([
        { section: 'blog', title: 'Original', href: 'content/blog/demo.html' },
        { section: 'blog', title: 'Duplicate', href: '/content/blog/demo.html' },
        { id: 'poem-demo', section: 'poem', title: 'Poem' },
        { id: 'poem-demo', section: 'poem', title: 'Poem Duplicate' }
    ]);

    assert.deepEqual(randomItems.map((item) => item.url), [
        '/content/blog/demo.html',
        '/reader.html?work=poem-demo'
    ]);
});

test('article poem and blog all enter the random content pool', () => {
    const randomItems = getRandomContentItems(works);
    const sections = new Set(randomItems.map((item) => item.section));

    assert.equal(randomItems.length, 31);
    assert.equal(randomItems.filter((item) => item.section === 'article').length, 6);
    assert.equal(randomItems.filter((item) => item.section === 'poem').length, 21);
    assert.equal(randomItems.filter((item) => item.section === 'blog').length, 4);
    assert.deepEqual([...sections].sort(), ['article', 'blog', 'poem']);
});

test('random content navigation assigns the selected URL', () => {
    const destination = {
        assigned: '',
        assign(url) {
            this.assigned = url;
        }
    };

    assert.equal(navigateToRandomContent([{ url: '/reader.html?work=demo' }], destination, () => 0), '/reader.html?work=demo');
    assert.equal(destination.assigned, '/reader.html?work=demo');
});

test('library sections are ordered as blog articles and poem', () => {
    assert.deepEqual(workSections.map((section) => section.title), ['Blog', 'Article', 'Poem']);
    assert.deepEqual(workSections.map((section) => section.id), ['blog', 'articles', 'poem']);
});

test('articles keep the visible advice tech and essay entries', () => {
    const articleIds = works.filter((work) => work.section === 'articles').map((work) => work.id);

    assert.deepEqual(articleIds, ['software-major', 'how-llm-is-born', 'what-is-transformer', 'mamba-paper-reading', 'spring-essay', 'materialism-idealism']);
    assert.equal(works.some((work) => work.id === 'capital-scientific-thinking'), false);
    assert.equal(works.some((work) => work.id === 'digital-labor-alienation'), false);
});

test('removed article sources are not left behind in the published content tree', async () => {
    const removedArticlePaths = [
        '../../content/articles/数字时代劳动异化的四重维度与解放路径.docx',
        '../../content/articles/数字时代劳动异化的四重维度与解放路径.pdf',
        '../../content/articles/《资本论》中的科学思维 .docx',
        '../../content/articles/《资本论》中的科学思维 .pdf',
        '../../content/articles-html/digital-labor-alienation.html',
        '../../content/articles-html/capital-scientific-thinking.html'
    ];

    for (const articlePath of removedArticlePaths) {
        await assert.rejects(
            access(new URL(articlePath, import.meta.url)),
            { code: 'ENOENT' }
        );
    }
});

test('article conversion script keeps the visible docx-backed articles', async () => {
    const script = await readFile(new URL('../../scripts/convert_articles.py', import.meta.url), 'utf8');

    assert.match(script, /software-major/);
    assert.match(script, /materialism-idealism/);
    assert.doesNotMatch(script, /capital-scientific-thinking/);
    assert.doesNotMatch(script, /digital-labor-alienation/);
});

test('software major article follows the expanded volunteer-advice structure', async () => {
    const article = await readFile(new URL('../../content/articles-html/software-major.html', import.meta.url), 'utf8');

    assert.match(article, /专业定位/);
    assert.match(article, /值不值得报/);
    assert.match(article, /就业去向/);
    assert.match(article, /行业前景/);
    assert.match(article, /报考建议/);
    assert.match(article, /人工智能发展迅速/);
    assert.match(article, /学校层次很重要/);
    assert.match(article, /南京大学的软件学科/);
});

test('mamba article reads like a complete paper-reading blog', async () => {
    const article = await readFile(new URL('../../content/articles-html/mamba-paper-reading.html', import.meta.url), 'utf8');

    assert.match(article, /Mamba 论文阅读：选择性状态空间模型如何挑战 Transformer/);
    assert.match(article, /状态空间模型/);
    assert.match(article, /线性时不变性/);
    assert.match(article, /选择性状态空间模型/);
    assert.match(article, /class="doc-formula"/);
    assert.match(article, /h<sub>t<\/sub> = A h<sub>t-1<\/sub> \+ B x<sub>t<\/sub>/);
    assert.match(article, /B = s<sub>B<\/sub>\(x\)/);
    assert.match(article, /⊙/);
    assert.match(article, /硬件感知/);
    assert.match(article, /selective scan/);
    assert.match(article, /我的理解/);
    assert.match(article, /参考文献/);
    assert.match(article, /https:\/\/arxiv\.org\/abs\/2312\.00752/);
    assert.doesNotMatch(article, /author|CONTENTS|谢谢观看/);
});

test('transformer article explains the architecture with original examples', async () => {
    const article = await readFile(new URL('../../content/articles-html/what-is-transformer.html', import.meta.url), 'utf8');

    assert.match(article, /Transformer是什么？/);
    assert.match(article, /Attention Is All You Need/);
    assert.match(article, /Query、Key、Value/);
    assert.match(article, /class="doc-formula"/);
    assert.match(article, /Attention\(Q, K, V\) = softmax/);
    assert.match(article, /多头注意力/);
    assert.match(article, /MultiHead\(Q, K, V\)/);
    assert.match(article, /位置编码/);
    assert.match(article, /PE\(pos, 2i\)/);
    assert.match(article, /encoder-decoder/);
    assert.match(article, /masked self-attention/);
    assert.match(article, /钥匙放进书包/);
    assert.match(article, /图书馆找资料/);
    assert.match(article, /参考文献/);
    assert.match(article, /https:\/\/arxiv\.org\/abs\/1706\.03762/);
    assert.doesNotMatch(article, /10分钟速通|复制此链接|Dou音|抖音搜索/);
});

test('llm birth article covers the training pipeline with formulas and references', async () => {
    const article = await readFile(new URL('../../content/articles-html/how-llm-is-born.html', import.meta.url), 'utf8');

    assert.match(article, /大语言模型如何诞生/);
    assert.match(article, /预训练/);
    assert.match(article, /监督微调/);
    assert.match(article, /RLHF/);
    assert.match(article, /DPO/);
    assert.match(article, /class="doc-formula"/);
    assert.match(article, /P\(x<sub>1:T<\/sub>\)/);
    assert.match(article, /L<sub>SFT<\/sub>/);
    assert.match(article, /L<sub>DPO<\/sub>/);
    assert.match(article, /参考文献/);
    assert.match(article, /https:\/\/arxiv\.org\/abs\/2005\.14165/);
    assert.match(article, /https:\/\/arxiv\.org\/abs\/2203\.02155/);
    assert.match(article, /https:\/\/arxiv\.org\/abs\/2305\.18290/);
});

test('article html pages use polished standalone reading styles', async () => {
    const articlePaths = [
        '../../content/articles-html/software-major.html',
        '../../content/articles-html/how-llm-is-born.html',
        '../../content/articles-html/mamba-paper-reading.html',
        '../../content/articles-html/what-is-transformer.html',
        '../../content/print/spring-essay.html'
    ];
    const css = await readFile(new URL('../../assets/css/site.css', import.meta.url), 'utf8');

    assert.match(css, /\.article-document \.doc-subtitle\s*\{[\s\S]*text-align:\s*center/);
    assert.match(css, /body\.article-standalone h1\s*\{[\s\S]*text-align:\s*center/);
    assert.match(css, /body\.article-standalone \.doc-subtitle\s*\{[\s\S]*text-align:\s*center/);
    assert.match(css, /\.article-document \.doc-formula,[\s\S]*body\.article-standalone \.doc-formula\s*\{[\s\S]*overflow-x:\s*auto/);

    for (const articlePath of articlePaths) {
        const article = await readFile(new URL(articlePath, import.meta.url), 'utf8');
        assert.match(article, /<link rel="stylesheet" href="\.\.\/\.\.\/assets\/css\/site\.css">/);
        assert.match(article, /<body class="article-standalone">/);
    }
});

test('reader pages place the article before the table of contents inside a document layout', async () => {
    const reader = await readFile(new URL('../../assets/js/reader.js', import.meta.url), 'utf8');

    assert.match(reader, /reader-document-layout/);
    assert.ok(reader.indexOf('layout.append(article') < reader.indexOf('layout.append(toc'));
});

test('reader detail pages wrap meta document and navigation in one reading container', async () => {
    const reader = await readFile(new URL('../../assets/js/reader.js', import.meta.url), 'utf8');
    const css = await readFile(new URL('../../assets/css/site.css', import.meta.url), 'utf8');

    assert.match(reader, /reading-container/);
    assert.match(reader, /has-toc/);
    assert.match(css, /\.reading-container\s*\{[\s\S]*max-width:\s*var\(--reading-width\)/);
    assert.match(css, /\.reading-container\s*\{[\s\S]*margin:\s*0;/);
    assert.match(css, /\.reader-shell\s*\{[\s\S]*margin:\s*0;/);
    assert.match(css, /\.reader-body\s*\{[\s\S]*padding:\s*28px 30px 46px 316px/);
    assert.match(css, /\.reader-document-layout\.has-toc\s*\{/);
    assert.match(css, /\.poem-document\s*\{[\s\S]*width:\s*100%/);
    assert.match(css, /\.reader-nav\s*\{[\s\S]*width:\s*100%/);
});

test('static blog detail pages receive shared meta and adjacent navigation chrome', async () => {
    const homeScript = await readFile(new URL('../../assets/js/home.js', import.meta.url), 'utf8');

    assert.match(homeScript, /bindStaticBlogDetailChrome/);
    assert.match(homeScript, /createDetailMeta/);
    assert.match(homeScript, /createDetailNavigation/);
    assert.match(homeScript, /blog-document-layout/);
});

test('homepage keeps three quiet featured entries from real content', () => {
    assert.deepEqual(getFeaturedWorks(works, 3).map((work) => work.id), [
        'how-llm-is-born',
        'what-is-transformer',
        'mamba-paper-reading'
    ]);
});

test('featured works include quiet card metadata for homepage display', () => {
    getFeaturedWorks(works, 3).forEach((work) => {
        assert.ok(work.summary);
        assert.ok(Array.isArray(work.tags));
        assert.ok(work.tags.length >= 2);
    });
});

test('featured work cards render metadata summary tags and action text', () => {
    const originalDocument = globalThis.document;

    globalThis.document = {
        ...originalDocument,
        createElement(tagName) {
            return {
                tagName,
                attributes: {},
                children: [],
                className: '',
                href: '',
                textContent: '',
                setAttribute(name, value) {
                    this.attributes[name] = value;
                },
                append(...nodes) {
                    this.children.push(...nodes);
                }
            };
        }
    };

    try {
        const rendered = createFeaturedWorkCard({
            id: 'demo',
            section: 'blog',
            title: 'Demo Work',
            href: 'content/blog/demo.html',
            date: '课程笔记',
            summary: 'A short summary.',
            tags: ['JavaScript', 'Writing']
        });

        assert.equal(rendered.className, 'featured-work-card');
        assert.equal(rendered.href, '/content/blog/demo.html');
        assert.equal(rendered.attributes['aria-label'], '阅读Demo Work');
        assert.ok(rendered.children.some((node) => node.className === 'featured-work-meta' && node.textContent === '博客 · 课程笔记'));
        assert.ok(rendered.children.some((node) => node.tagName === 'strong' && node.textContent === 'Demo Work'));
        assert.ok(rendered.children.some((node) => node.tagName === 'p' && node.textContent === 'A short summary.'));
        assert.ok(rendered.children.some((node) => node.className === 'featured-work-tags' && node.children.map((child) => child.textContent).join(',') === 'JavaScript,Writing'));
        assert.ok(rendered.children.some((node) => node.className === 'featured-work-action' && node.textContent === '打开阅读'));
    } finally {
        globalThis.document = originalDocument;
    }
});

test('homepage uses the mature integrated profile structure', async () => {
    const home = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
    const libraryPanel = await readFile(new URL('../../_includes/library-panel.html', import.meta.url), 'utf8');

    assert.match(home, /class="site-nav"/);
    assert.match(libraryPanel, /class="library-panel site-sidebar"/);
    assert.match(libraryPanel, /class="sidebar-nav"/);
    assert.match(home, /id="works"/);
    assert.match(home, /id="about"/);
    assert.match(home, /id="music"/);
    assert.match(home, /id="contact"/);
    assert.doesNotMatch(home, /class="home-aside"/);
    assert.match(libraryPanel, /<h2>宵宵<\/h2>/);
    assert.match(libraryPanel, /一个慢慢生长的个人空间/);
    assert.ok(home.indexOf('class="site-nav"') < home.indexOf('id="about"'));
    assert.ok(home.indexOf('id="about"') < home.indexOf('id="works"'));
    assert.ok(home.indexOf('id="about"') < home.indexOf('id="contact"'));
    assert.doesNotMatch(home, /最近更新|热门标签/);
    assert.doesNotMatch(home, /class="profile-card"/);
    assert.doesNotMatch(home, /class="hero-panel"/);
    assert.doesNotMatch(home, /class="hero-profile"/);
});

test('homepage navigation points to primary sections and contact paths', async () => {
    const home = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
    const libraryPanel = await readFile(new URL('../../_includes/library-panel.html', import.meta.url), 'utf8');
    const libraryPage = await readFile(new URL('../../library.html', import.meta.url), 'utf8');
    const libraryCatalog = await readFile(new URL('../../_includes/library-catalog.html', import.meta.url), 'utf8');

    assert.match(home, /href="#works"/);
    assert.match(home, /href="#about"/);
    assert.match(home, /href="{{ '\/music\.html' \| relative_url }}"/);
    assert.match(home, /href="#contact"/);
    assert.match(libraryPanel, /href="{{ '\/' \| relative_url }}">首页/);
    assert.match(libraryPanel, /href="{{ '\/library\.html' \| relative_url }}">书架/);
    assert.match(libraryPanel, /href="{{ '\/music\.html' \| relative_url }}">播放列表/);
    assert.doesNotMatch(libraryPanel, /精选内容|关于我|联系|GitHub|Email/);
    assert.doesNotMatch(libraryPanel, /href="#library-sections"|id="library-sections"|library-search/);
    assert.match(home, /href="{{ '\/library\.html' \| relative_url }}">查看全部/);
    assert.match(libraryPage, /include library-catalog\.html/);
    assert.match(libraryCatalog, /id="library-sections"/);
    assert.doesNotMatch(libraryCatalog, />搜索文章或诗词</);
    assert.doesNotMatch(libraryCatalog, /library-search-status/);
    assert.match(libraryCatalog, /<summary><span>Article<\/span><span class="section-count">6<\/span><\/summary>/);
    const css = await readFile(new URL('../../assets/css/site.css', import.meta.url), 'utf8');
    assert.match(css, /\.library-section summary\s*\{[\s\S]*width:\s*192px/);
    assert.match(home, /mailto:2125808970@qq.com/);
    assert.match(home, /https:\/\/github.com\/SxLin0/);
});

test('homepage copy reads as a personal space instead of a resume showcase', async () => {
    const home = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
    const libraryPanel = await readFile(new URL('../../_includes/library-panel.html', import.meta.url), 'utf8');

    assert.doesNotMatch(home, /<h1 id="hero-title">宵宵<\/h1>/);
    assert.doesNotMatch(home, /hero-lead|hero-actions|阅读精选|打开书架/);
    assert.match(libraryPanel, /一个慢慢生长的个人空间/);
    assert.match(home, /南京大学软件工程（智能化软件）本科生在读/);
    assert.doesNotMatch(home, /Personal Knowledge Base|Poems & Notes|这里是我的综合个人档案|学习、写作和生活中的一些痕迹/);
    assert.doesNotMatch(home, /面试官|求职|审阅|展示给老师|开源朋友认真阅读/);
});

test('homepage avoids duplicate library navigation cards', async () => {
    const home = await readFile(new URL('../../index.html', import.meta.url), 'utf8');

    assert.doesNotMatch(home, /content-map-panel/);
    assert.doesNotMatch(home, /section-map-title/);
    assert.doesNotMatch(home, /网站内容/);
    assert.doesNotMatch(home, /书架导航/);
});

test('site metadata supports SEO and social sharing', async () => {
    const config = await readFile(new URL('../../_config.yml', import.meta.url), 'utf8');
    const layout = await readFile(new URL('../../_layouts/ocean.html', import.meta.url), 'utf8');

    assert.match(config, /宵宵的个人主页，记录软件工程课程笔记、技术文章、诗词创作与个人作品。/);
    assert.match(layout, /property="og:title"/);
    assert.match(layout, /property="og:description"/);
    assert.match(layout, /property="og:image"/);
    assert.match(layout, /name="keywords"/);
});

test('site assets use a build version query to avoid stale browser cache', async () => {
    const layout = await readFile(new URL('../../_layouts/ocean.html', import.meta.url), 'utf8');
    const home = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
    const reader = await readFile(new URL('../../reader.html', import.meta.url), 'utf8');
    const blogLayout = await readFile(new URL('../../_layouts/blog_article.html', import.meta.url), 'utf8');
    const homeScript = await readFile(new URL('../../assets/js/home.js', import.meta.url), 'utf8');
    const readerScript = await readFile(new URL('../../assets/js/reader.js', import.meta.url), 'utf8');

    assert.match(layout, /assets\/css\/main\.css' \| relative_url }}\?v=/);
    assert.match(layout, /assets\/css\/site\.css' \| relative_url }}\?v=/);
    assert.match(home, /assets\/js\/home\.js' \| relative_url }}\?v=/);
    assert.match(reader, /assets\/js\/reader\.js' \| relative_url }}\?v=/);
    assert.match(blogLayout, /assets\/js\/home\.js' \| relative_url }}\?v=/);
    assert.match(homeScript, /\.\.\/data\/works\.js\?v=/);
    assert.match(readerScript, /\.\.\/data\/works\.js\?v=/);
});

test('homepage introduction avoids stale school age and grade text', async () => {
    const home = await readFile(new URL('../../index.html', import.meta.url), 'utf8');

    assert.doesNotMatch(home, /<s>/);
    assert.doesNotMatch(home, /sophomore|junior|大三在读|南京大学在读/);
    assert.match(home, /南京大学软件工程（智能化软件）本科生在读/);
});

test('homepage interface labels are localized for a Chinese personal blog', async () => {
    const home = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
    const libraryPanel = await readFile(new URL('../../_includes/library-panel.html', import.meta.url), 'utf8');
    const homeScript = await readFile(new URL('../../assets/js/home.js', import.meta.url), 'utf8');
    const combined = `${home}\n${libraryPanel}\n${homeScript}`;

    assert.match(home, /精选内容/);
    assert.match(home, /查看全部/);
    assert.match(home, /<h2 id="about-title">关于我<\/h2>/);
    assert.match(home, /<h2 id="contact-title">联系<\/h2>/);
    assert.doesNotMatch(home, /最近更新|<h2 id="music-title">播放列表<\/h2>/);
    assert.match(home, /<h2 id="music-title">音乐<\/h2>/);
    assert.match(libraryPanel, />首页</);
    assert.match(libraryPanel, />书架</);
    assert.match(libraryPanel, />播放列表</);
    assert.doesNotMatch(libraryPanel, />关于我<|>联系</);
    assert.match(homeScript, /getSpotifyPlaylistEmbedUrl/);
    assert.doesNotMatch(combined, /Featured Works|Start reading|About Me|Now Playing|Select a track|Playlist ready|6 tracks|>Home</);
});

test('sidebar section entries keep only library and music as dedicated pages', async () => {
    const music = await readFile(new URL('../../music.html', import.meta.url), 'utf8');
    const css = await readFile(new URL('../../assets/css/site.css', import.meta.url), 'utf8');
    const config = await readFile(new URL('../../_config.yml', import.meta.url), 'utf8');
    const home = await readFile(new URL('../../index.html', import.meta.url), 'utf8');

    assert.match(music, /sidebar_active:\s*music/);
    assert.match(music, /id="music-title"/);
    assert.match(music, /href="{{ '\/' \| relative_url }}#about"/);
    assert.match(music, /href="{{ '\/' \| relative_url }}#contact"/);
    assert.doesNotMatch(music, /about\.html|contact\.html/);
    assert.match(music, /src="{{ spotify_embed_url }}"/);
    assert.match(music, /loading="lazy"/);
    assert.match(music, /width="100%"/);
    assert.match(music, /allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"/);
    assert.match(css, /\.music-playlist-block\s*\{/);
    assert.match(config, /music:\s*\n  provider: spotify\s*\n  playlist_id: "3stiJxjy2he1ije4wJHxTu"/);
    assert.doesNotMatch(config, new RegExp(`playlist${'_' }url`));
    assert.doesNotMatch(`${home}\n${music}`, /<p class="music-/);
});

test('homepage about copy and tags stay personal instead of resume-like', async () => {
    const home = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
    const libraryPanel = await readFile(new URL('../../_includes/library-panel.html', import.meta.url), 'utf8');
    const overdoneCopy = /面试官|老师|同学|开源朋友|作品集展示|快速了解|专业展示|简历|求职/;
    const inflatedTags = /全栈开发|AI|产品经理|创业|效率达人|未来主义|数字游民/;

    assert.match(libraryPanel, /一个慢慢生长的个人空间/);
    assert.match(home, /不写代码的时候，我多半在听歌、读书、打游戏、骑车，或者琢磨下一顿吃什么/);
    assert.match(home, /技术内容尽量清楚可靠/);
    assert.match(home, /我是宵宵，南京大学软件工程（智能化软件）本科生在读/);
    assert.doesNotMatch(home, /我是\s+<b>宵宵<\/b>|我是 <b>宵宵<\/b>/);
    assert.match(home, /南京大学软件工程（智能化软件）本科生在读/);
    assert.match(home, /写东西/);
    assert.match(home, /生活/);
    assert.match(home, /📚 课程笔记/);
    assert.match(home, /🍜 美食/);
    assert.doesNotMatch(home, /C\+\+|Python|JavaScript|Spring Boot|后端开发|开源项目|个人作品集/);
    assert.doesNotMatch(home, overdoneCopy);
    assert.doesNotMatch(home, inflatedTags);
});

test('contact card keeps calm copy values and a lightweight QQ copy affordance', async () => {
    const home = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
    const css = await readFile(new URL('../../assets/css/site.css', import.meta.url), 'utf8');
    const homeScript = await readFile(new URL('../../assets/js/home.js', import.meta.url), 'utf8');

    assert.match(home, /class="contact-value"/);
    assert.match(home, /class="copy-contact"/);
    assert.match(home, /data-copy-value="2125808970"/);
    assert.match(css, /\.contact-copy-row/);
    assert.match(css, /overflow-wrap:\s*anywhere/);
    assert.match(homeScript, /bindContactCopy/);
    assert.equal(getContactCopyLabel('copied'), '已复制');
    assert.equal(getContactCopyLabel('idle'), '复制');
});

test('mobile library panel behaves like a floating drawer instead of pushing content down', async () => {
    const css = await readFile(new URL('../../assets/css/site.css', import.meta.url), 'utf8');
    const mobileCss = css.slice(css.indexOf('@media (max-width: 860px)'));

    assert.match(mobileCss, /\.library-panel\s*\{[\s\S]*position:\s*fixed/);
    assert.match(mobileCss, /\.library-panel\s*\{[\s\S]*bottom:\s*14px/);
    assert.match(mobileCss, /\.library-panel\.is-open\s*\{[\s\S]*top:\s*14px/);
    assert.match(mobileCss, /\.library-panel\.is-open\s*\{[\s\S]*max-height:\s*calc\(100dvh - 28px\)/);
    assert.match(mobileCss, /\.home-body,[\s\S]*\.reader-body\s*\{[\s\S]*padding:\s*20px 14px 96px/);
});

test('library scroll position is normalized before saving', () => {
    assert.equal(normalizeLibraryScrollTop(42.7), 43);
    assert.equal(normalizeLibraryScrollTop(-10), 0);
    assert.equal(normalizeLibraryScrollTop('not-a-number'), 0);
});

test('mobile library panel state is normalized for the drawer button', () => {
    assert.equal(normalizeLibraryPanelOpen(true), true);
    assert.equal(normalizeLibraryPanelOpen('true'), true);
    assert.equal(normalizeLibraryPanelOpen(false), false);
    assert.equal(normalizeLibraryPanelOpen(null), false);
});

test('mobile library drawer toggle label reflects its open state', () => {
    assert.equal(getLibraryToggleLabel(true), '收起');
    assert.equal(getLibraryToggleLabel(false), '菜单');
    assert.equal(getLibraryToggleLabel('true'), '收起');
});

test('mobile library drawer can be dismissed with Escape', async () => {
    const homeScript = await readFile(new URL('../../assets/js/home.js', import.meta.url), 'utf8');

    assert.match(homeScript, /keydown/);
    assert.match(homeScript, /event\.key === 'Escape'/);
    assert.match(homeScript, /saveLibraryPanelOpen\(false\)/);
});

test('homepage library entry links point to the dedicated library page', async () => {
    const home = await readFile(new URL('../../index.html', import.meta.url), 'utf8');

    assert.match(home, /href="{{ '\/library\.html' \| relative_url }}">查看全部/);
    assert.doesNotMatch(home, /href="#library-panel-content"/);
});

test('site supports keyboard focus visibility and reduced motion preferences', async () => {
    const css = await readFile(new URL('../../assets/css/site.css', import.meta.url), 'utf8');

    assert.match(css, /:focus-visible/);
    assert.match(css, /outline:\s*3px solid/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(css, /scroll-behavior:\s*auto/);
});

test('library search text is normalized before filtering', () => {
    assert.equal(normalizeLibrarySearchQuery('  春茶  '), '春茶');
    assert.equal(normalizeLibrarySearchQuery(' DataBase '), 'database');
    assert.equal(normalizeLibrarySearchQuery(null), '');
});

test('library search status summarizes total and filtered results', () => {
    assert.equal(getLibrarySearchStatus('', 0, 27), '');
    assert.equal(getLibrarySearchStatus('春', 2, 29), '找到 2 篇作品');
    assert.equal(getLibrarySearchStatus('missing', 0, 29), '没有匹配的作品');
});

test('reader navigation finds previous and next works in the same section', async () => {
    globalThis.window = {
        location: {
            search: '?work=missing'
        }
    };
    globalThis.document = {
        getElementById() {
            return {
                replaceChildren() {}
            };
        },
        createElement() {
            return {};
        }
    };

    const { getAdjacentSectionWorks } = await import('./reader.js');
    const works = [
        { id: 'one', section: 'poem', title: '一' },
        { id: 'two', section: 'poem', title: '二' },
        { id: 'blog', section: 'blog', title: '博客' },
        { id: 'three', section: 'poem', title: '三' }
    ];

    assert.deepEqual(getAdjacentSectionWorks(works, works[1]), {
        previous: works[0],
        next: works[3]
    });
});

test('reader headings get stable generated ids', async () => {
    const { createHeadingId } = await import('./reader.js');

    assert.equal(createHeadingId(0), 'section-1');
    assert.equal(createHeadingId(4), 'section-5');
});

test('reading progress is clamped between 0 and 100', async () => {
    const { normalizeReadingProgress } = await import('./reader.js');

    assert.equal(normalizeReadingProgress(10, 100, 500), 0);
    assert.equal(normalizeReadingProgress(300, 100, 500), 50);
    assert.equal(normalizeReadingProgress(900, 100, 500), 100);
    assert.equal(normalizeReadingProgress(100, 100, 100), 0);
});

test('reader metadata filters empty values and keeps useful labels', async () => {
    const { getReaderMetaItems } = await import('./reader.js');

    assert.deepEqual(getReaderMetaItems({
        section: 'articles',
        date: '2026',
        summary: '一段说明'
    }), ['Article', '2026', '一段说明']);
    assert.deepEqual(getReaderMetaItems({ section: 'missing' }), ['Writing']);
});

test('featured works are selected in display order and capped', () => {
    const sampleWorks = [
        { id: 'hidden', title: 'Hidden', featured: false },
        { id: 'third', title: 'Third', featured: true, featuredOrder: 3 },
        { id: 'first', title: 'First', featured: true, featuredOrder: 1 },
        { id: 'second', title: 'Second', featured: true, featuredOrder: 2 }
    ];

    assert.deepEqual(getFeaturedWorks(sampleWorks, 2).map((item) => item.id), ['first', 'second']);
});

test('active work id is resolved from reader query or rooted href', () => {
    const sampleWorks = [
        { id: 'poem', href: '', section: 'poem' },
        { id: 'blog', href: 'content/blog/database.html', section: 'blog' }
    ];

    assert.equal(getActiveWorkIdFromLocation({ search: '?work=poem', pathname: '/reader.html' }, sampleWorks), 'poem');
    assert.equal(getActiveWorkIdFromLocation({ search: '', pathname: '/content/blog/database.html' }, sampleWorks), 'blog');
});

test('Spotify playlist embed URL is built from a single playlist id', () => {
    assert.equal(
        getSpotifyPlaylistEmbedUrl('3stiJxjy2he1ije4wJHxTu'),
        'https://open.spotify.com/embed/playlist/3stiJxjy2he1ije4wJHxTu'
    );
    assert.equal(getSpotifyPlaylistEmbedUrl(''), '');
});

test('music embed URLs keep provider switching explicit', () => {
    assert.equal(
        getMusicEmbedUrl('spotify', '3stiJxjy2he1ije4wJHxTu'),
        'https://open.spotify.com/embed/playlist/3stiJxjy2he1ije4wJHxTu'
    );
    assert.equal(getMusicEmbedUrl('netease', 'demo'), '');
});
