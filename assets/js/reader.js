import { works, workSections } from '../data/works.js';

const params = new URLSearchParams(window.location.search);
const work = works.find((item) => item.id === params.get('work'));
const stage = document.getElementById('reader-stage');
let activeProgressHandler = null;

function showError(message) {
    if (!stage) {
        return;
    }

    stage.replaceChildren(Object.assign(document.createElement('div'), {
        className: 'reader-error',
        textContent: message
    }));
}

export function getAdjacentSectionWorks(allWorks, currentWork) {
    if (!currentWork) {
        return {
            previous: null,
            next: null
        };
    }

    const sectionWorks = allWorks.filter((item) => item.section === currentWork.section);
    const currentIndex = sectionWorks.findIndex((item) => item.id === currentWork.id);

    return {
        previous: currentIndex > 0 ? sectionWorks[currentIndex - 1] : null,
        next: currentIndex >= 0 && currentIndex < sectionWorks.length - 1 ? sectionWorks[currentIndex + 1] : null
    };
}

export function createHeadingId(index) {
    return `section-${index + 1}`;
}

export function normalizeReadingProgress(scrollY, start, end) {
    if (end <= start) {
        return 0;
    }

    return Math.max(0, Math.min(100, Math.round(((scrollY - start) / (end - start)) * 100)));
}

function getReaderSectionTitle(sectionId) {
    return workSections.find((section) => section.id === sectionId)?.title || 'Writing';
}

export function getReaderMetaItems(currentWork) {
    return [
        getReaderSectionTitle(currentWork?.section),
        currentWork?.date,
        currentWork?.summary
    ].filter(Boolean);
}

function resolveReaderWorkHref(candidate) {
    if (candidate.href) {
        return `/${candidate.href.replace(/^\/+/, '')}`;
    }

    return `/reader.html?work=${encodeURIComponent(candidate.id)}`;
}

function createReaderNavLink(label, candidate) {
    if (!candidate) {
        const placeholder = document.createElement('span');
        placeholder.className = 'reader-nav-placeholder';
        return placeholder;
    }

    const link = document.createElement('a');
    const labelText = document.createElement('span');
    const title = document.createElement('strong');

    link.href = resolveReaderWorkHref(candidate);
    labelText.textContent = label;
    title.textContent = candidate.title;
    link.append(labelText, title);
    return link;
}

function createReaderNavigation(currentWork) {
    const nav = document.createElement('nav');
    const adjacent = getAdjacentSectionWorks(works, currentWork);

    nav.className = 'reader-nav';
    nav.setAttribute('aria-label', '作品导航');
    nav.append(
        createReaderNavLink('上一篇', adjacent.previous),
        createReaderNavLink('下一篇', adjacent.next)
    );
    return nav;
}

function getArticleHeadings(article) {
    return Array.from(article.querySelectorAll('h2, h3'))
        .filter((heading) => heading.textContent.trim())
        .map((heading, index) => {
            if (!heading.id) {
                heading.id = createHeadingId(index);
            }

            return {
                id: heading.id,
                level: heading.tagName.toLowerCase(),
                title: heading.textContent.trim()
            };
        });
}

function createReaderToc(article) {
    const headings = getArticleHeadings(article);
    if (headings.length < 2) {
        return null;
    }

    const nav = document.createElement('nav');
    const title = document.createElement('h3');
    const list = document.createElement('div');

    nav.className = 'reader-toc';
    nav.setAttribute('aria-label', '文章目录');
    title.textContent = '目录';
    list.className = 'reader-toc-links';

    headings.forEach((heading) => {
        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.className = `reader-toc-link is-${heading.level}`;
        link.textContent = heading.title;
        list.append(link);
    });

    nav.append(title, list);
    return nav;
}

function createReadingProgress(article) {
    const progress = document.createElement('div');
    const bar = document.createElement('span');

    progress.className = 'reader-progress';
    progress.setAttribute('aria-hidden', 'true');
    bar.className = 'reader-progress-bar';
    progress.append(bar);

    if (activeProgressHandler) {
        window.removeEventListener('scroll', activeProgressHandler);
        window.removeEventListener('resize', activeProgressHandler);
    }

    activeProgressHandler = () => {
        const rect = article.getBoundingClientRect();
        const start = window.scrollY + rect.top - 24;
        const end = start + article.scrollHeight - window.innerHeight + 160;
        const progressValue = normalizeReadingProgress(window.scrollY, start, end);
        bar.style.width = `${progressValue}%`;
    };

    activeProgressHandler();
    window.addEventListener('scroll', activeProgressHandler, { passive: true });
    window.addEventListener('resize', activeProgressHandler, { passive: true });
    return progress;
}

function createReaderMeta(currentWork) {
    const metaItems = getReaderMetaItems(currentWork);
    if (!metaItems.length) {
        return null;
    }

    const aside = document.createElement('aside');
    const details = document.createElement('div');

    aside.className = 'reader-meta';
    aside.setAttribute('aria-label', '作品信息');
    details.className = 'reader-meta-items';

    metaItems.forEach((item, index) => {
        const element = document.createElement(index === metaItems.length - 1 && item === currentWork?.summary ? 'p' : 'span');
        element.textContent = item;
        details.append(element);
    });

    aside.append(details);
    return aside;
}

function renderWorkDocument(article, options = {}) {
    const children = [];
    const meta = createReaderMeta(work);
    const container = document.createElement('div');
    const layout = document.createElement('div');

    container.className = 'reading-container';
    layout.className = 'reader-document-layout';

    if (options.showReaderTools) {
        const progress = createReadingProgress(article);
        const toc = createReaderToc(article);

        children.push(progress);
        if (meta) {
            container.append(meta);
        }
        layout.append(article);
        if (toc) {
            layout.classList.add('has-toc');
            layout.append(toc);
        }
    } else if (meta) {
        container.append(meta);
        layout.append(article);
    } else {
        layout.append(article);
    }

    container.append(layout, createReaderNavigation(work));
    children.push(container);
    stage.replaceChildren(...children);
}

function cleanImportedHtml(doc) {
    const article = document.createElement('article');
    article.className = 'article-document';

    Array.from(doc.body.children).forEach((child) => {
        if (child.tagName.toLowerCase() !== 'script') {
            article.append(child.cloneNode(true));
        }
    });

    return article;
}

function plainMarkdownText(text) {
    return text
        .replace(/^#{1,6}\s+/, '')
        .replace(/^\*\*(.*)\*\*$/, '$1')
        .replace(/^__(.*)__$/, '$1')
        .replace(/<br\s*\/?><\/br>/gi, '')
        .trim();
}

function createParagraph(className, text) {
    const paragraph = document.createElement('p');
    paragraph.className = className;
    paragraph.textContent = text;
    return paragraph;
}

function isPoemDate(line) {
    return /^\d{4}([年./-]|$)/.test(line) || /^\d{4}.*(春|夏|秋|冬|中秋|新春|暮秋|春末|夏天)$/.test(line);
}

function renderMarkdownPoem(markdown) {
    const article = document.createElement('article');
    const lines = markdown.split(/\r?\n/).map((line) => line.trim());
    const nonEmptyLines = lines.filter(Boolean);
    const titleText = plainMarkdownText(nonEmptyLines[0] || work.title);
    const heading = document.createElement('h1');
    const poemLines = document.createElement('div');

    article.className = 'article-document poem-document';
    heading.textContent = titleText || work.title;
    poemLines.className = 'poem-lines';
    article.append(heading);

    nonEmptyLines.slice(1).forEach((rawLine) => {
        const line = plainMarkdownText(rawLine);
        if (!line) {
            return;
        }

        if (line.startsWith('注：')) {
            article.append(createParagraph('poem-note', line));
            return;
        }

        if (isPoemDate(line)) {
            article.append(createParagraph('poem-date', line));
            return;
        }

        poemLines.append(createParagraph('', line));
    });

    article.insertBefore(poemLines, article.querySelector('.poem-note') || null);
    return article;
}

async function loadHtmlWork() {
    const response = await fetch(work.source);
    if (!response.ok) {
        throw new Error(`Cannot load ${work.source}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    renderWorkDocument(cleanImportedHtml(doc), { showReaderTools: true });
}

async function loadMarkdownPoemWork() {
    const response = await fetch(work.source);
    if (!response.ok) {
        throw new Error(`Cannot load ${work.source}`);
    }

    const markdown = await response.text();
    renderWorkDocument(renderMarkdownPoem(markdown));
}

function loadPdfWork() {
    const article = document.createElement('article');
    const object = document.createElement('object');
    const fallback = document.createElement('p');
    const fallbackLink = document.createElement('a');

    article.className = 'pdf-document';
    object.className = 'pdf-viewer';
    object.type = 'application/pdf';
    object.data = work.source;

    fallbackLink.href = work.source;
    fallbackLink.textContent = '打开 PDF';
    fallback.append('当前浏览器无法直接显示 PDF，', fallbackLink, '。');
    object.append(fallback);
    article.append(object);
    renderWorkDocument(article);
}

async function loadWork() {
    if (!work) {
        showError('The requested work does not exist. Please return home and choose another title.');
        return;
    }

    document.title = `${work.title} - 宵宵`;

    try {
        if (work.kind === 'html') {
            await loadHtmlWork();
        } else if (work.kind === 'markdown-poem') {
            await loadMarkdownPoemWork();
        } else {
            loadPdfWork();
        }
    } catch (error) {
        showError('The work could not be loaded. Please try again later.');
        console.error(error);
    }
}

loadWork();
