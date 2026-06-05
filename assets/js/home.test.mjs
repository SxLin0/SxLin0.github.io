import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.document = {
    getElementById() {
        return null;
    }
};

const { resolveLibrarySectionOpen } = await import('./home.js');

test('uses the section default when no saved state exists', () => {
    assert.equal(resolveLibrarySectionOpen({ id: 'blog', open: true }, {}), true);
    assert.equal(resolveLibrarySectionOpen({ id: 'articles', open: false }, {}), false);
});

test('saved state overrides the section default', () => {
    assert.equal(resolveLibrarySectionOpen({ id: 'blog', open: true }, { blog: false }), false);
    assert.equal(resolveLibrarySectionOpen({ id: 'articles', open: false }, { articles: true }), true);
});
