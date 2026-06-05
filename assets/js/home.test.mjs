import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

globalThis.document = {
    getElementById() {
        return null;
    }
};

const { resolveLibrarySectionOpen, resolveWorkHref } = await import('./home.js');

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

test('library links are rooted so they work from nested pages', () => {
    assert.equal(resolveWorkHref({ href: 'content/blog/operating-system.html' }), '/content/blog/operating-system.html');
    assert.equal(resolveWorkHref({ id: 'spring-essay' }), '/reader.html?work=spring-essay');
});
