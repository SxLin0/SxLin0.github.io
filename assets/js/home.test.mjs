import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { works, workSections } from '../data/works.js';

globalThis.document = {
    getElementById() {
        return null;
    }
};

const {
    getLibrarySearchStatus,
    getActiveWorkIdFromLocation,
    getArticleTocHeadings,
    getFeaturedWorks,
    getPlaybackProgress,
    normalizeLibrarySearchQuery,
    normalizeLibraryPanelOpen,
    normalizeLibraryScrollTop,
    renderPlaybackTime,
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

test('library sections are reduced to blog poem and articles', () => {
    assert.deepEqual(workSections.map((section) => section.title), ['Blog', 'Poem', 'Articles']);
    assert.deepEqual(workSections.map((section) => section.id), ['blog', 'poem', 'articles']);
});

test('articles keep software advice and moved essays only', () => {
    const articleIds = works.filter((work) => work.section === 'articles').map((work) => work.id);

    assert.deepEqual(articleIds, ['software-major', 'spring-essay']);
    assert.equal(works.some((work) => work.id === 'capital-scientific-thinking'), false);
    assert.equal(works.some((work) => work.id === 'digital-labor-alienation'), false);
});

test('homepage keeps four balanced featured works after article cleanup', () => {
    assert.deepEqual(getFeaturedWorks(works).map((work) => work.id), [
        'software-major',
        'spring-tea',
        'spring-essay',
        'yellow-river'
    ]);
});

test('homepage introduction avoids stale strikethrough age and grade text', async () => {
    const home = await readFile(new URL('../../index.html', import.meta.url), 'utf8');

    assert.doesNotMatch(home, /<s>/);
    assert.doesNotMatch(home, /sophomore|junior/);
    assert.match(home, /undergraduate student/);
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

test('library search text is normalized before filtering', () => {
    assert.equal(normalizeLibrarySearchQuery('  春茶  '), '春茶');
    assert.equal(normalizeLibrarySearchQuery(' DataBase '), 'database');
    assert.equal(normalizeLibrarySearchQuery(null), '');
});

test('library search status summarizes total and filtered results', () => {
    assert.equal(getLibrarySearchStatus('', 0, 27), '共 27 篇作品');
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
    }), ['Articles', '2026', '一段说明']);
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

test('playback time is rendered as minutes and seconds', () => {
    assert.equal(renderPlaybackTime(0), '0:00');
    assert.equal(renderPlaybackTime(7), '0:07');
    assert.equal(renderPlaybackTime(245), '4:05');
    assert.equal(renderPlaybackTime(Number.NaN), '0:00');
});

test('playback progress is clamped to a percentage', () => {
    assert.equal(getPlaybackProgress(30, 120), 25);
    assert.equal(getPlaybackProgress(300, 120), 100);
    assert.equal(getPlaybackProgress(-5, 120), 0);
    assert.equal(getPlaybackProgress(30, 0), 0);
});
