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

async function loadHtmlWork() {
    const response = await fetch(work.source);
    if (!response.ok) {
        throw new Error(`Cannot load ${work.source}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    stage.replaceChildren(cleanImportedHtml(doc));
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
        } else {
            loadPdfWork();
        }
    } catch (error) {
        showError('The work could not be loaded. Please try again later.');
        console.error(error);
    }
}

loadWork();
