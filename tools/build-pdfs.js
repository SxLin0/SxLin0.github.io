const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const works = [
    {
        id: 'software-major',
        title: '关于填报软件工程专业的一些看法',
        section: 'Articles',
        type: 'article',
        source: 'content/readable/articles/software-major.txt'
    },
    {
        id: 'capital-scientific-thinking',
        title: '《资本论》中的科学思维',
        section: 'Articles',
        type: 'article',
        source: 'content/readable/articles/capital-scientific-thinking.txt'
    },
    {
        id: 'digital-labor-alienation',
        title: '数字时代劳动异化的四重维度与解放路径',
        section: 'Articles',
        type: 'article',
        source: 'content/readable/articles/digital-labor-alienation.txt'
    },
    {
        id: 'summer-thoughts',
        title: '夏日咏怀',
        section: 'Poem & Essay',
        type: 'poem',
        source: 'content/poem-essay/夏日咏怀.md'
    },
    {
        id: 'night-boat-home',
        title: '夜行舟归家',
        section: 'Poem & Essay',
        type: 'poem',
        source: 'content/poem-essay/夜行舟归家.md'
    },
    {
        id: 'untitled-mid-autumn',
        title: '无题',
        section: 'Poem & Essay',
        type: 'poem',
        source: 'content/poem-essay/无题.md'
    },
    {
        id: 'yellow-river',
        title: '登黄河古迹怀古',
        section: 'Poem & Essay',
        type: 'poem',
        source: 'content/poem-essay/登黄河古迹怀古.md'
    },
    {
        id: 'red-beans',
        title: '红豆',
        section: 'Poem & Essay',
        type: 'poem',
        source: 'content/poem-essay/红豆.md'
    },
    {
        id: 'spring-essay',
        title: '浅谈“春”',
        section: 'Poem & Essay',
        type: 'essay',
        source: 'content/readable/poem-essay/spring-essay.txt'
    }
];

function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function normalize(text) {
    return text
        .replace(/[\u200e\u200f]/g, '')
        .replace(/\u2028/g, '\n')
        .replace(/^\*\*(.+?)\*\*/m, '$1')
        .trim();
}

function inlineMarkdown(text) {
    return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function renderArticle(text) {
    const lines = normalize(text).split(/\n+/).map((line) => line.trim()).filter(Boolean);
    return lines.map((line, index) => {
        if (index === 0) {
            return '';
        }

        if (/^(摘要|关键词|引\s*言|结\s*语|参考文献|写在前面|核心结论)/.test(line)) {
            return `<p class="lead">${inlineMarkdown(line)}</p>`;
        }

        if (/^[一二三四五六七八九十]+[、.]/.test(line)) {
            return `<h2>${inlineMarkdown(line)}</h2>`;
        }

        if (/^\d+(\.\d+)*\s/.test(line)) {
            return `<h3>${inlineMarkdown(line)}</h3>`;
        }

        if (/^[-•]\s*/.test(line)) {
            return `<p class="bullet">${inlineMarkdown(line.replace(/^[-•]\s*/, ''))}</p>`;
        }

        return `<p>${inlineMarkdown(line)}</p>`;
    }).join('\n');
}

function renderPoem(text) {
    const lines = normalize(text).split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const body = lines.slice(1).map((line) => `<p>${inlineMarkdown(line)}</p>`).join('\n');
    return `<div class="poem-lines">${body}</div>`;
}

function renderHtml(work, content) {
    const isPoem = work.type === 'poem';
    const rendered = isPoem ? renderPoem(content) : renderArticle(content);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(work.title)}</title>
    <style>
        @page {
            size: A4;
            margin: 18mm 17mm;
        }

        body {
            margin: 0;
            color: #222831;
            background: #fff;
            font-family: "Songti SC", "Noto Serif CJK SC", "SimSun", serif;
            font-size: 12.2pt;
            line-height: 1.82;
        }

        .cover-rule {
            width: 56px;
            height: 5px;
            margin-bottom: 18px;
            border-radius: 99px;
            background: #ff4757;
        }

        .section {
            display: inline-block;
            margin-bottom: 12px;
            padding: 3px 10px;
            color: #3867d6;
            border-radius: 99px;
            background: #edf4ff;
            font: 700 9.5pt "Segoe UI", sans-serif;
            letter-spacing: 0;
        }

        h1 {
            margin: 0 0 20px;
            color: #171717;
            font-size: ${isPoem ? '26pt' : '23pt'};
            line-height: 1.25;
            font-weight: 800;
        }

        h2 {
            margin: 22px 0 8px;
            color: #ff4757;
            font-size: 16pt;
            line-height: 1.35;
            break-after: avoid;
        }

        h3 {
            margin: 16px 0 6px;
            color: #2f5fb3;
            font-size: 13.5pt;
            line-height: 1.4;
            break-after: avoid;
        }

        p {
            margin: 0 0 9px;
            text-align: justify;
        }

        .lead {
            padding: 11px 14px;
            border-left: 4px solid #70a1ff;
            border-radius: 6px;
            background: #f7faff;
        }

        .bullet {
            position: relative;
            margin-left: 18px;
        }

        .bullet::before {
            content: "";
            position: absolute;
            left: -16px;
            top: 0.76em;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #70a1ff;
        }

        .poem-lines {
            margin-top: 30px;
            font-size: 16pt;
            line-height: 2.15;
            text-align: center;
        }

        .poem-lines p {
            text-align: center;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="cover-rule"></div>
    <div class="section">${escapeHtml(work.section)}</div>
    <h1>${escapeHtml(work.title)}</h1>
    ${rendered}
</body>
</html>`;
}

if (!fs.existsSync(chrome)) {
    throw new Error(`Chrome not found at ${chrome}`);
}

fs.mkdirSync(path.join(root, 'content/print'), { recursive: true });
fs.mkdirSync(path.join(root, 'content/pdf'), { recursive: true });

for (const work of works) {
    const sourcePath = path.join(root, work.source);
    const htmlPath = path.join(root, 'content/print', `${work.id}.html`);
    const pdfPath = path.join(root, 'content/pdf', `${work.id}.pdf`);
    const content = fs.readFileSync(sourcePath, 'utf8');

    fs.writeFileSync(htmlPath, renderHtml(work, content));
    execFileSync(chrome, [
        '--headless=new',
        '--disable-gpu',
        '--no-pdf-header-footer',
        `--print-to-pdf=${pdfPath}`,
        `file://${htmlPath}`
    ], { stdio: 'inherit' });
}
