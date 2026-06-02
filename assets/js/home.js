import { works, workSections } from '../data/works.js';

const library = document.getElementById('library-sections');
const playlist = document.getElementById('playlist');
const audioPlayer = document.getElementById('audio-player');

function createWorkCard(work) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const title = document.createElement('span');

    link.className = 'work-card';
    link.href = work.href || `reader.html?work=${encodeURIComponent(work.id)}`;
    title.className = 'work-title';
    title.textContent = work.title;

    link.append(title);
    item.append(link);
    return item;
}

function renderLibrary() {
    if (!library) {
        return;
    }

    library.replaceChildren();

    workSections.forEach((section) => {
        const sectionWorks = works.filter((work) => work.section === section.id);
        if (!sectionWorks.length) {
            return;
        }

        const sectionEl = document.createElement('details');
        const heading = document.createElement('summary');
        const headingText = document.createElement('span');
        const count = document.createElement('span');
        const list = document.createElement('ul');

        sectionEl.className = 'library-section';
        sectionEl.open = section.open !== false;
        headingText.textContent = section.title;
        count.className = 'section-count';
        count.textContent = sectionWorks.length;
        heading.append(headingText, count);
        list.className = 'work-list';
        sectionWorks.forEach((work) => list.append(createWorkCard(work)));

        sectionEl.append(heading, list);
        library.append(sectionEl);
    });
}

function bindPlaylist() {
    if (!playlist || !audioPlayer) {
        return;
    }

    const items = Array.from(playlist.querySelectorAll('li'));

    items.forEach((item) => {
        item.addEventListener('click', () => {
            audioPlayer.src = item.dataset.src;
            audioPlayer.play();
            items.forEach((candidate) => candidate.classList.remove('active'));
            item.classList.add('active');
            audioPlayer.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

renderLibrary();
bindPlaylist();
