import { works } from '../data/works.js';

const params = new URLSearchParams(window.location.search);
const work = works.find((item) => item.id === params.get('work'));
const stage = document.getElementById('reader-stage');

function showError(message) {
    stage.replaceChildren(Object.assign(document.createElement('div'), {
        className: 'reader-error',
        textContent: message
    }));
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
    stage.replaceChildren(cleanImportedHtml(doc));
}

async function loadMarkdownPoemWork() {
    const response = await fetch(work.source);
    if (!response.ok) {
        throw new Error(`Cannot load ${work.source}`);
    }

    const markdown = await response.text();
    stage.replaceChildren(renderMarkdownPoem(markdown));
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
    stage.replaceChildren(article);
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
