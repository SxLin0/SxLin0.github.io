# Personal Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mature, concise integrated personal homepage for 宵宵 while preserving the existing writing library, reader pages, playlist, and contact interactions.

**Architecture:** Keep the current static Jekyll architecture. `index.html` owns homepage structure, `assets/css/site.css` owns the shared visual system, `assets/js/home.js` owns small local interactions and dynamic work rendering, and `assets/data/works.js` remains the content source of truth.

**Tech Stack:** Jekyll/GitHub Pages, Liquid templates, vanilla JavaScript ES modules, CSS, Node test runner.

---

## File Structure

- Modify `assets/js/home.test.mjs`: add homepage structure and featured-card rendering tests that describe the new mature profile requirements.
- Modify `assets/js/home.js`: expose tags in dynamically rendered featured cards and keep existing library/player/contact behavior stable.
- Modify `index.html`: replace the current card-heavy homepage with the integrated profile layout.
- Modify `assets/css/site.css`: rebuild homepage, library, featured-card, about, contact, and playlist styles around the new calmer visual language while preserving reader styles.
- Optional generated output: `_site/` may change during local Jekyll builds but should not be committed because it is ignored.

## Task 1: Add Tests for the New Homepage Contract

**Files:**
- Modify: `assets/js/home.test.mjs`

- [ ] **Step 1: Add structure tests for the redesigned homepage**

Append these tests near the existing homepage tests in `assets/js/home.test.mjs`:

```js
test('homepage uses the mature integrated profile structure', async () => {
    const home = await readFile(new URL('../../index.html', import.meta.url), 'utf8');

    assert.match(home, /class="site-nav"/);
    assert.match(home, /class="hero-profile"/);
    assert.match(home, /id="works"/);
    assert.match(home, /id="about"/);
    assert.match(home, /id="music"/);
    assert.match(home, /id="contact"/);
    assert.match(home, /综合个人档案|个人主页|个人知识库/);
});

test('homepage navigation points to the primary content sections', async () => {
    const home = await readFile(new URL('../../index.html', import.meta.url), 'utf8');

    assert.match(home, /href="#works"/);
    assert.match(home, /href="#about"/);
    assert.match(home, /href="#music"/);
    assert.match(home, /href="#contact"/);
    assert.match(home, /href="https:\/\/github.com\/SxLin0"/);
    assert.match(home, /href="mailto:2125808970@qq.com"/);
});

test('homepage avoids the previous decorative profile card shell', async () => {
    const home = await readFile(new URL('../../index.html', import.meta.url), 'utf8');

    assert.doesNotMatch(home, /class="profile-card"/);
    assert.doesNotMatch(home, /class="hero-panel"/);
});
```

- [ ] **Step 2: Add a dynamic featured-card test**

Append this DOM-oriented test after the `featured works include quiet card metadata` test:

```js
test('featured work cards render metadata, summary, tags, and action text', () => {
    const appended = [];
    const card = {
        className: '',
        href: '',
        attributes: {},
        children: appended,
        setAttribute(name, value) {
            this.attributes[name] = value;
        },
        append(...nodes) {
            appended.push(...nodes);
        }
    };

    const originalDocument = globalThis.document;
    globalThis.document = {
        ...originalDocument,
        createElement(tagName) {
            return {
                tagName,
                className: '',
                textContent: '',
                children: [],
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
        }, card);

        assert.equal(rendered.className, 'featured-work-card');
        assert.equal(rendered.href, '/content/blog/demo.html');
        assert.equal(rendered.attributes['aria-label'], '阅读Demo Work');
        assert.ok(appended.some((node) => node.className === 'featured-work-meta' && node.textContent === '博客 · 课程笔记'));
        assert.ok(appended.some((node) => node.tagName === 'strong' && node.textContent === 'Demo Work'));
        assert.ok(appended.some((node) => node.tagName === 'p' && node.textContent === 'A short summary.'));
        assert.ok(appended.some((node) => node.className === 'featured-work-tags' && node.children.map((child) => child.textContent).join(',') === 'JavaScript,Writing'));
        assert.ok(appended.some((node) => node.className === 'featured-work-action' && node.textContent === '打开阅读'));
    } finally {
        globalThis.document = originalDocument;
    }
});
```

- [ ] **Step 3: Export `createFeaturedWorkCard` for testing**

Change this function signature in `assets/js/home.js` during Task 2:

```js
export function createFeaturedWorkCard(work) {
```

- [ ] **Step 4: Run tests to verify the new tests fail before implementation**

Run:

```bash
node --test assets/js/home.test.mjs
```

Expected: FAIL because `createFeaturedWorkCard` is not exported yet and `index.html` still uses the old `profile-card` and `hero-panel` structure.

## Task 2: Update Featured Work Rendering

**Files:**
- Modify: `assets/js/home.js`

- [ ] **Step 1: Export and extend `createFeaturedWorkCard`**

Replace the existing `createFeaturedWorkCard` function with:

```js
export function createFeaturedWorkCard(work) {
    const link = document.createElement('a');
    const meta = document.createElement('span');
    const title = document.createElement('strong');
    const summary = document.createElement('p');
    const tags = document.createElement('span');
    const action = document.createElement('span');

    link.className = 'featured-work-card';
    link.href = resolveWorkHref(work);
    link.setAttribute('aria-label', `阅读${work.title}`);
    meta.className = 'featured-work-meta';
    meta.textContent = [getSectionTitle(work.section), work.date].filter(Boolean).join(' · ');
    title.textContent = work.title;
    summary.textContent = work.summary || '打开作品继续阅读。';
    tags.className = 'featured-work-tags';
    (work.tags || []).forEach((tag) => {
        const tagElement = document.createElement('span');
        tagElement.textContent = tag;
        tags.append(tagElement);
    });
    action.className = 'featured-work-action';
    action.textContent = '打开阅读';
    link.append(meta, title, summary, tags, action);
    return link;
}
```

- [ ] **Step 2: Run focused tests**

Run:

```bash
node --test assets/js/home.test.mjs
```

Expected: homepage structure tests still FAIL, featured card test PASS.

- [ ] **Step 3: Commit the JS rendering change with tests**

Run:

```bash
git add assets/js/home.js assets/js/home.test.mjs
git commit -m "test: define homepage redesign contract"
```

Expected: a commit containing only tests and the featured-card export/rendering adjustment.

## Task 3: Replace Homepage Markup

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace the body content inside `<div class="home-body">`**

Keep the front matter and final module script. Replace the current `<main class="page-shell">...</main>` content with this structure:

```html
<main class="page-shell">
    {% include library-panel.html %}

    <div class="home-stack">
        <nav class="site-nav" aria-label="首页导航">
            <a class="site-brand" href="{{ '/' | relative_url }}" aria-label="回到首页">宵宵</a>
            <div class="site-nav-links">
                <a href="#works">作品</a>
                <a href="#about">关于</a>
                <a href="#music">音乐</a>
                <a href="#contact">联系</a>
            </div>
        </nav>

        <section class="hero-profile" aria-labelledby="hero-title">
            <div class="hero-copy">
                <p class="hero-kicker">南京大学软件工程在读 / 写作者 / 个人知识库维护者</p>
                <h1 id="hero-title">宵宵</h1>
                <p class="hero-subtitle">Software Engineering, Writing, Poems and Notes.</p>
                <p class="hero-lead">这里是我的综合个人档案：整理课程笔记、技术文章、长文思考、诗词练习、音乐与生活碎片。希望它像一间清楚的书房，既能快速找到内容，也能留下真实的个人气息。</p>
                <div class="hero-actions" aria-label="首页快捷入口">
                    <a class="hero-action primary" href="#works">阅读精选</a>
                    <a class="hero-action" href="#library-panel-content">打开书架</a>
                    <a class="hero-action" href="https://github.com/SxLin0" target="_blank" rel="noreferrer">GitHub</a>
                    <a class="hero-action" href="mailto:2125808970@qq.com">Email</a>
                </div>
            </div>

            <aside class="hero-card" aria-label="个人摘要">
                <img src="{{ '/src/photo.jpg' | relative_url }}" alt="宵宵的头像">
                <div>
                    <p class="hero-card-label">Current Focus</p>
                    <strong>软件工程 / 后端开发 / 知识整理</strong>
                    <span>C++ · Java · Python · JavaScript · Spring Boot</span>
                </div>
                <dl class="hero-facts" aria-label="网站内容概览">
                    <div><dt>Blog</dt><dd>课程笔记</dd></div>
                    <div><dt>Poem</dt><dd>诗词创作</dd></div>
                    <div><dt>Articles</dt><dd>长文观点</dd></div>
                </dl>
            </aside>
        </section>
```

Continue the same file with sections for `works`, content map, `about`, `music`, `contact`, and footer. Reuse the existing playlist `<li>` entries exactly so audio paths and cover paths stay stable. Move contact markup into a section with `id="contact"` and keep `.copy-contact` buttons and `data-copy-value` unchanged.

- [ ] **Step 2: Run homepage structure tests**

Run:

```bash
node --test assets/js/home.test.mjs
```

Expected: all JS tests PASS or only CSS-independent assertions PASS. If any test fails because of a missing anchor or class, update `index.html` to match the plan names.

- [ ] **Step 3: Commit homepage markup**

Run:

```bash
git add index.html
git commit -m "feat: restructure homepage profile layout"
```

Expected: a commit containing only `index.html`.

## Task 4: Rebuild Homepage and Library Styles

**Files:**
- Modify: `assets/css/site.css`

- [ ] **Step 1: Replace the color tokens**

Update the `:root` block to:

```css
:root {
    --ink: #172b36;
    --muted: #657780;
    --primary: #176b87;
    --primary-dark: #0f4055;
    --accent: #4b9db6;
    --seal: #a24b3d;
    --paper: #fbfaf7;
    --surface: rgba(255, 255, 255, 0.86);
    --surface-strong: rgba(255, 255, 255, 0.96);
    --line: rgba(23, 107, 135, 0.14);
    --shadow: 0 18px 48px rgba(27, 49, 61, 0.1);
    --soft-shadow: 0 10px 28px rgba(27, 49, 61, 0.08);
    --radius: 12px;
    --reading-width: 1060px;
}
```

- [ ] **Step 2: Replace homepage-specific styles**

Remove the old `.profile-card`, `.hero-panel`, `.section-map-card`, `.about-panel`, `.playlist`, and contact homepage blocks. Add styles for `.home-stack`, `.site-nav`, `.hero-profile`, `.hero-card`, `.featured-panel`, `.content-map`, `.about-layout`, `.profile-list`, `.skill-clusters`, `.music-panel`, and `.contact-panel`.

Use these required layout rules:

```css
.home-body {
    padding: 28px 28px 38px 340px;
}

.home-stack {
    display: grid;
    gap: 20px;
}

.site-nav {
    position: sticky;
    top: 18px;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 12px 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: rgba(255, 255, 255, 0.82);
    box-shadow: var(--soft-shadow);
    backdrop-filter: blur(18px);
}

.hero-profile {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
    gap: 24px;
    align-items: stretch;
    min-height: 430px;
    padding: clamp(28px, 5vw, 54px);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(251, 250, 247, 0.92));
    box-shadow: var(--shadow);
}
```

- [ ] **Step 3: Add responsive rules**

Add these breakpoints without removing reader-page rules:

```css
@media (max-width: 1180px) {
    .home-body,
    .reader-body {
        padding-left: 28px;
    }

    .library-panel {
        position: sticky;
        top: 14px;
        width: 100%;
        max-height: none;
        margin-bottom: 18px;
    }
}

@media (max-width: 820px) {
    .home-body {
        padding: 14px;
    }

    .site-nav,
    .hero-profile,
    .about-layout,
    .mini-player {
        grid-template-columns: 1fr;
    }

    .site-nav {
        position: static;
        align-items: flex-start;
    }

    .hero-profile {
        min-height: 0;
        padding: 24px;
    }

    .playlist ul,
    .featured-works,
    .content-map {
        grid-template-columns: 1fr;
    }
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
node --test assets/js/home.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit CSS changes**

Run:

```bash
git add assets/css/site.css
git commit -m "style: polish personal homepage"
```

Expected: a commit containing only `assets/css/site.css`.

## Task 5: Build and Manual Verification

**Files:**
- Read: `README.md`
- Run only: `node --test assets/js/home.test.mjs`, `bundle exec jekyll build`

- [ ] **Step 1: Run the Node tests**

Run:

```bash
node --test assets/js/home.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 2: Build the Jekyll site**

Run:

```bash
bundle exec jekyll build
```

Expected: build succeeds and writes the site to `_site/`.

- [ ] **Step 3: Start a local server for visual QA**

Run:

```bash
bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

Expected: server prints a local URL such as `http://127.0.0.1:4000/`.

- [ ] **Step 4: Inspect desktop and mobile**

Open the served homepage and check:

- Desktop width around 1440px: no overlapping nav, hero, library, cards, playlist, or contact text.
- Mobile width around 390px: no horizontal scroll, library collapsed by default, hero content stacked, playlist controls usable.
- Click featured works, content map links, GitHub, email, QQ copy, playlist item, play/pause button, and library search.

- [ ] **Step 5: Fix any visual regressions and rerun verification**

If visual regressions appear, edit only `index.html`, `assets/css/site.css`, or `assets/js/home.js` as needed. Then rerun:

```bash
node --test assets/js/home.test.mjs
bundle exec jekyll build
```

Expected: tests and build PASS.

- [ ] **Step 6: Commit final fixes**

Run:

```bash
git add index.html assets/css/site.css assets/js/home.js assets/js/home.test.mjs
git commit -m "fix: verify redesigned homepage"
```

Expected: commit only if there were post-QA fixes. If no fixes were needed, skip this commit.

## Self-Review

- Spec coverage: homepage structure, calmer visual design, library preservation, JS/framework decision, responsiveness, accessibility, and verification are all mapped to tasks.
- Placeholder scan: no open placeholders or undefined task references remain.
- Type consistency: class names referenced by tests and CSS are the same names required in `index.html`.
