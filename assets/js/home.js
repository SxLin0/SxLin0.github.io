import { works, workSections } from '../data/works.js';

const library = document.getElementById('library-sections');
const librarySearch = document.getElementById('library-search');
const playlist = document.getElementById('playlist');
const audioPlayer = document.getElementById('audio-player');
const libraryStateKey = 'sxlin-library-open-sections';
const libraryScrollKey = 'sxlin-library-scroll-top';

function getLibraryStorage() {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

function getLibraryState() {
    const storage = getLibraryStorage();
    if (!storage) {
        return {};
    }

    try {
        return JSON.parse(storage.getItem(libraryStateKey)) || {};
    } catch {
        return {};
    }
}

function saveLibraryState(sectionId, isOpen) {
    const storage = getLibraryStorage();
    if (!storage) {
        return;
    }

    const state = getLibraryState();
    state[sectionId] = isOpen;
    storage.setItem(libraryStateKey, JSON.stringify(state));
}

export function normalizeLibraryScrollTop(scrollTop) {
    const parsedScrollTop = Number(scrollTop);

    if (!Number.isFinite(parsedScrollTop) || parsedScrollTop < 0) {
        return 0;
    }

    return Math.round(parsedScrollTop);
}

function getSavedLibraryScrollTop() {
    const storage = getLibraryStorage();
    if (!storage) {
        return 0;
    }

    return normalizeLibraryScrollTop(storage.getItem(libraryScrollKey));
}

function saveLibraryScrollTop(scrollTop) {
    const storage = getLibraryStorage();
    if (!storage) {
        return;
    }

    storage.setItem(libraryScrollKey, String(normalizeLibraryScrollTop(scrollTop)));
}

function getLibraryPanel() {
    return library?.closest('.library-panel') || document.querySelector?.('.library-panel') || null;
}

export function resolveLibrarySectionOpen(section, savedState) {
    if (!section) {
        return false;
    }

    if (Object.prototype.hasOwnProperty.call(savedState, section.id)) {
        return Boolean(savedState[section.id]);
    }

    return section.open !== false;
}

export function resolveWorkHref(work) {
    if (work.href) {
        return `/${work.href.replace(/^\/+/, '')}`;
    }

    return `/reader.html?work=${encodeURIComponent(work.id)}`;
}

function createWorkCard(work) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const title = document.createElement('span');

    link.className = 'work-card';
    link.href = resolveWorkHref(work);
    link.dataset.title = work.title.toLowerCase();
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
        const savedState = getLibraryState();

        sectionEl.className = 'library-section';
        sectionEl.dataset.sectionId = section.id;
        sectionEl.open = resolveLibrarySectionOpen(section, savedState);
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

function bindLibrarySections() {
    if (!library) {
        return;
    }

    const libraryPanel = getLibraryPanel();

    library.querySelectorAll('.library-section').forEach((section) => {
        section.addEventListener('toggle', () => {
            if (librarySearch?.value.trim()) {
                return;
            }

            saveLibraryState(section.dataset.sectionId, section.open);
        });
    });

    library.querySelectorAll('.work-card').forEach((card) => {
        card.addEventListener('click', () => {
            const section = card.closest('.library-section');
            if (section) {
                saveLibraryState(section.dataset.sectionId, true);
            }

            if (libraryPanel) {
                saveLibraryScrollTop(libraryPanel.scrollTop);
            }
        });
    });
}

function bindLibraryScroll() {
    const libraryPanel = getLibraryPanel();
    if (!libraryPanel) {
        return;
    }

    libraryPanel.addEventListener('scroll', () => {
        saveLibraryScrollTop(libraryPanel.scrollTop);
    }, { passive: true });
}

function restoreLibraryScroll() {
    const libraryPanel = getLibraryPanel();
    const scrollTop = getSavedLibraryScrollTop();
    if (!libraryPanel || !scrollTop) {
        return;
    }

    const schedule = window.requestAnimationFrame || ((callback) => window.setTimeout(callback, 0));
    schedule(() => {
        libraryPanel.scrollTop = scrollTop;
    });
}

function bindLibrarySearch() {
    if (!library || !librarySearch) {
        return;
    }

    const applySearchFilter = () => {
        const query = librarySearch.value.trim().toLowerCase();

        Array.from(library.querySelectorAll('.library-section')).forEach((section) => {
            const cards = Array.from(section.querySelectorAll('.work-card'));
            let visibleCount = 0;

            cards.forEach((card) => {
                const isMatch = !query || card.dataset.title.includes(query);
                card.parentElement.hidden = !isMatch;
                if (isMatch) {
                    visibleCount += 1;
                }
            });

            section.hidden = visibleCount === 0;
            if (query) {
                section.open = Boolean(visibleCount);
            } else {
                const sectionConfig = workSections.find((item) => item.id === section.dataset.sectionId);
                section.open = resolveLibrarySectionOpen(sectionConfig, getLibraryState());
            }
        });
    };

    librarySearch.addEventListener('input', applySearchFilter);
    librarySearch.addEventListener('search', applySearchFilter);
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
restoreLibraryScroll();
bindLibrarySections();
bindLibraryScroll();
bindLibrarySearch();
bindPlaylist();
