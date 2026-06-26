import { works, workSections } from '../data/works.js';

const library = document.getElementById('library-sections');
const librarySearch = document.getElementById('library-search');
const librarySearchClear = document.getElementById('library-search-clear');
const librarySearchEmpty = document.getElementById('library-search-empty');
const librarySearchStatus = document.getElementById('library-search-status');
const playlist = document.getElementById('playlist');
const audioPlayer = document.getElementById('audio-player');
const featuredWorks = document.getElementById('featured-works');
const playerToggle = document.getElementById('player-toggle');
const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const playerProgress = document.getElementById('player-progress');
const playerCurrentTime = document.getElementById('player-current-time');
const playerDuration = document.getElementById('player-duration');
const libraryStateKey = 'sxlin-library-open-sections';
const libraryScrollKey = 'sxlin-library-scroll-top';
const libraryPanelOpenKey = 'sxlin-library-panel-open';

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

export function normalizeLibraryPanelOpen(value) {
    return value === true || value === 'true';
}

export function getLibraryToggleLabel(isOpen) {
    return normalizeLibraryPanelOpen(isOpen) ? '收起' : '书架';
}

export function normalizeLibrarySearchQuery(value) {
    return String(value || '').trim().toLowerCase();
}

export function getLibrarySearchStatus(query, visibleCount, totalCount) {
    if (!query) {
        return `共 ${totalCount} 篇作品`;
    }

    if (visibleCount > 0) {
        return `找到 ${visibleCount} 篇作品`;
    }

    return '没有匹配的作品';
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

function getSavedLibraryPanelOpen() {
    const storage = getLibraryStorage();
    if (!storage) {
        return false;
    }

    return normalizeLibraryPanelOpen(storage.getItem(libraryPanelOpenKey));
}

function saveLibraryPanelOpen(isOpen) {
    const storage = getLibraryStorage();
    if (!storage) {
        return;
    }

    storage.setItem(libraryPanelOpenKey, String(normalizeLibraryPanelOpen(isOpen)));
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

export function getFeaturedWorks(allWorks, limit = 4) {
    return allWorks
        .filter((work) => work.featured)
        .sort((first, second) => (first.featuredOrder || 999) - (second.featuredOrder || 999))
        .slice(0, limit);
}

export function getActiveWorkIdFromLocation(location, allWorks) {
    const query = new URLSearchParams(location.search || '');
    const queryWorkId = query.get('work');
    if (queryWorkId && allWorks.some((work) => work.id === queryWorkId)) {
        return queryWorkId;
    }

    const pathname = `/${(location.pathname || '').replace(/^\/+/, '')}`;
    const activeWork = allWorks.find((work) => work.href && pathname === resolveWorkHref(work));
    return activeWork?.id || '';
}

function setLibraryPanelOpen(panel, toggle, isOpen) {
    const normalizedOpen = normalizeLibraryPanelOpen(isOpen);
    const toggleText = toggle.querySelector?.('.library-toggle-text');

    panel.classList.toggle('is-open', normalizedOpen);
    toggle.setAttribute('aria-expanded', String(normalizedOpen));
    if (toggleText) {
        toggleText.textContent = getLibraryToggleLabel(normalizedOpen);
    }
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
    link.dataset.workId = work.id;
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
        const activeWorkId = getActiveWorkIdFromLocation(window.location, works);
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
        sectionEl.open = sectionWorks.some((sectionWork) => sectionWork.id === activeWorkId) || resolveLibrarySectionOpen(section, savedState);
        headingText.textContent = section.title;
        count.className = 'section-count';
        count.textContent = sectionWorks.length;
        heading.append(headingText, count);
        list.className = 'work-list';
        sectionWorks.forEach((work) => {
            const item = createWorkCard(work);
            const link = item.querySelector('.work-card');
            if (work.id === activeWorkId) {
                link.classList.add('is-active');
                link.setAttribute('aria-current', 'page');
            }
            list.append(item);
        });

        sectionEl.append(heading, list);
        library.append(sectionEl);
    });
}

function getSectionTitle(sectionId) {
    const localizedTitles = {
        articles: '文章',
        blog: '博客',
        poem: '诗词'
    };

    return localizedTitles[sectionId] || workSections.find((section) => section.id === sectionId)?.title || '作品';
}

function createFeaturedWorkCard(work) {
    const link = document.createElement('a');
    const meta = document.createElement('span');
    const title = document.createElement('strong');
    const summary = document.createElement('p');
    const action = document.createElement('span');

    link.className = 'featured-work-card';
    link.href = resolveWorkHref(work);
    link.setAttribute('aria-label', `阅读${work.title}`);
    meta.className = 'featured-work-meta';
    meta.textContent = [getSectionTitle(work.section), work.date].filter(Boolean).join(' · ');
    title.textContent = work.title;
    summary.textContent = work.summary || '打开作品继续阅读。';
    action.className = 'featured-work-action';
    action.textContent = '打开阅读';
    link.append(meta, title, summary, action);
    return link;
}

function renderFeaturedWorks() {
    if (!featuredWorks) {
        return;
    }

    featuredWorks.replaceChildren(...getFeaturedWorks(works, 3).map(createFeaturedWorkCard));
}

export function getArticleTocHeadings(article) {
    if (!article?.querySelectorAll) {
        return [];
    }

    let sectionIndex = 0;
    return Array.from(article.querySelectorAll('h2, h3'))
        .filter((heading) => {
            const level = heading.tagName?.toLowerCase();
            return (level === 'h2' || level === 'h3') && heading.textContent.trim();
        })
        .map((heading) => {
            sectionIndex += 1;
            if (!heading.id) {
                heading.id = `blog-section-${sectionIndex}`;
            }

            return {
                id: heading.id,
                level: heading.tagName.toLowerCase(),
                title: heading.textContent.trim()
            };
        });
}

function bindBlogArticleToc() {
    const article = document.querySelector?.('.markdown-document');
    const toc = document.getElementById('blog-toc');
    if (!article || !toc) {
        return;
    }

    const headings = getArticleTocHeadings(article);
    if (headings.length < 2) {
        toc.hidden = true;
        return;
    }

    const title = document.createElement('h3');
    const links = document.createElement('div');

    title.textContent = '目录';
    links.className = 'article-toc-links';

    headings.forEach((heading) => {
        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.className = `article-toc-link is-${heading.level}`;
        link.textContent = heading.title;
        links.append(link);
    });

    toc.replaceChildren(title, links);
    toc.hidden = false;
}

function getAdjacentSectionWorks(currentWork) {
    if (!currentWork) {
        return {
            previous: null,
            next: null
        };
    }

    const sectionWorks = works.filter((item) => item.section === currentWork.section);
    const currentIndex = sectionWorks.findIndex((item) => item.id === currentWork.id);

    return {
        previous: currentIndex > 0 ? sectionWorks[currentIndex - 1] : null,
        next: currentIndex >= 0 && currentIndex < sectionWorks.length - 1 ? sectionWorks[currentIndex + 1] : null
    };
}

function createDetailMeta(currentWork) {
    const metaItems = [
        workSections.find((section) => section.id === currentWork.section)?.title || getSectionTitle(currentWork.section),
        currentWork.date,
        currentWork.summary
    ].filter(Boolean);
    const aside = document.createElement('aside');
    const details = document.createElement('div');

    aside.className = 'reader-meta';
    aside.setAttribute('aria-label', '作品信息');
    details.className = 'reader-meta-items';
    metaItems.forEach((item, index) => {
        const element = document.createElement(index === metaItems.length - 1 && item === currentWork.summary ? 'p' : 'span');
        element.textContent = item;
        details.append(element);
    });

    aside.append(details);
    return aside;
}

function createDetailNavLink(label, candidate) {
    if (!candidate) {
        const placeholder = document.createElement('span');
        placeholder.className = 'reader-nav-placeholder';
        return placeholder;
    }

    const link = document.createElement('a');
    const labelText = document.createElement('span');
    const title = document.createElement('strong');

    link.href = resolveWorkHref(candidate);
    labelText.textContent = label;
    title.textContent = candidate.title;
    link.append(labelText, title);
    return link;
}

function createDetailNavigation(currentWork) {
    const nav = document.createElement('nav');
    const adjacent = getAdjacentSectionWorks(currentWork);

    nav.className = 'reader-nav';
    nav.setAttribute('aria-label', '作品导航');
    nav.append(
        createDetailNavLink('上一篇', adjacent.previous),
        createDetailNavLink('下一篇', adjacent.next)
    );
    return nav;
}

function bindStaticBlogDetailChrome() {
    const layout = document.querySelector?.('.blog-document-layout');
    const container = layout?.closest('.reading-container');
    if (!layout || !container) {
        return;
    }

    const activeWorkId = getActiveWorkIdFromLocation(window.location, works);
    const currentWork = works.find((item) => item.id === activeWorkId);
    if (!currentWork) {
        return;
    }

    if (!container.querySelector('.reader-meta')) {
        container.insertBefore(createDetailMeta(currentWork), layout);
    }

    if (!container.querySelector('.reader-nav')) {
        container.append(createDetailNavigation(currentWork));
    }
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

function bindLibraryPanelToggle() {
    const libraryPanel = getLibraryPanel();
    const toggle = libraryPanel?.querySelector('.library-toggle');
    if (!libraryPanel || !toggle) {
        return;
    }

    setLibraryPanelOpen(libraryPanel, toggle, getSavedLibraryPanelOpen());

    toggle.addEventListener('click', () => {
        const nextOpen = !libraryPanel.classList.contains('is-open');
        setLibraryPanelOpen(libraryPanel, toggle, nextOpen);
        saveLibraryPanelOpen(nextOpen);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && libraryPanel.classList.contains('is-open')) {
            setLibraryPanelOpen(libraryPanel, toggle, false);
            saveLibraryPanelOpen(false);
            toggle.focus();
        }
    });
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
        const query = normalizeLibrarySearchQuery(librarySearch.value);
        const totalCount = library.querySelectorAll('.work-card').length;
        let visibleTotal = 0;

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

            visibleTotal += visibleCount;
            section.hidden = visibleCount === 0;
            if (query) {
                section.open = Boolean(visibleCount);
            } else {
                const sectionConfig = workSections.find((item) => item.id === section.dataset.sectionId);
                section.open = resolveLibrarySectionOpen(sectionConfig, getLibraryState());
            }
        });

        if (librarySearchStatus) {
            librarySearchStatus.textContent = getLibrarySearchStatus(query, visibleTotal, totalCount);
        }
        if (librarySearchEmpty) {
            librarySearchEmpty.hidden = !query || visibleTotal > 0;
        }
        if (librarySearchClear) {
            librarySearchClear.hidden = !query;
        }
    };

    librarySearch.addEventListener('input', applySearchFilter);
    librarySearch.addEventListener('search', applySearchFilter);
    librarySearchClear?.addEventListener('click', () => {
        librarySearch.value = '';
        applySearchFilter();
        librarySearch.focus();
    });
    applySearchFilter();
}

export function renderPlaybackTime(seconds) {
    const normalizedSeconds = Number(seconds);
    if (!Number.isFinite(normalizedSeconds) || normalizedSeconds <= 0) {
        return '0:00';
    }

    const minutes = Math.floor(normalizedSeconds / 60);
    const remainingSeconds = Math.floor(normalizedSeconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function getPlaybackProgress(currentTime, duration) {
    const normalizedCurrentTime = Number(currentTime);
    const normalizedDuration = Number(duration);
    if (!Number.isFinite(normalizedCurrentTime) || !Number.isFinite(normalizedDuration) || normalizedDuration <= 0) {
        return 0;
    }

    return Math.max(0, Math.min(100, Math.round((normalizedCurrentTime / normalizedDuration) * 100)));
}

function getTrackInfo(item) {
    return {
        artist: item.querySelector('.artist')?.textContent?.trim() || 'Unknown artist',
        duration: item.querySelector('.duration')?.textContent?.trim() || '0:00',
        title: item.querySelector('.title')?.textContent?.trim() || 'Untitled'
    };
}

function setPlayerPlaying(isPlaying) {
    playerToggle?.classList.toggle('is-playing', isPlaying);
    playerToggle?.setAttribute('aria-label', isPlaying ? '暂停当前歌曲' : '播放选中的歌曲');
}

function playSelectedAudio() {
    const playRequest = audioPlayer.play();
    if (playRequest?.catch) {
        playRequest.catch(() => setPlayerPlaying(false));
    }
}

function updatePlayerTimes() {
    if (!audioPlayer || !playerProgress || !playerCurrentTime || !playerDuration) {
        return;
    }

    const duration = Number.isFinite(audioPlayer.duration) ? audioPlayer.duration : 0;
    playerProgress.value = String(getPlaybackProgress(audioPlayer.currentTime, duration));
    playerCurrentTime.textContent = renderPlaybackTime(audioPlayer.currentTime);
    if (duration) {
        playerDuration.textContent = renderPlaybackTime(duration);
    }
}

function selectPlaylistItem(item, shouldPlay = true) {
    const items = Array.from(playlist.querySelectorAll('li'));
    const track = getTrackInfo(item);

    audioPlayer.src = item.dataset.src;
    items.forEach((candidate) => candidate.classList.remove('active'));
    item.classList.add('active');

    if (playerTitle) {
        playerTitle.textContent = track.title;
    }
    if (playerArtist) {
        playerArtist.textContent = track.artist;
    }
    if (playerDuration) {
        playerDuration.textContent = track.duration;
    }
    if (playerCurrentTime) {
        playerCurrentTime.textContent = '0:00';
    }
    if (playerProgress) {
        playerProgress.disabled = false;
        playerProgress.value = '0';
    }
    if (playerToggle) {
        playerToggle.disabled = false;
    }

    if (shouldPlay) {
        playSelectedAudio();
    }
}

function bindPlaylist() {
    if (!playlist || !audioPlayer) {
        return;
    }

    const items = Array.from(playlist.querySelectorAll('li'));

    items.forEach((item) => {
        item.addEventListener('click', () => {
            selectPlaylistItem(item);
        });
    });

    playerToggle?.addEventListener('click', () => {
        if (!audioPlayer.src && items[0]) {
            selectPlaylistItem(items[0]);
            return;
        }

        if (audioPlayer.paused) {
            playSelectedAudio();
        } else {
            audioPlayer.pause();
        }
    });

    playerProgress?.addEventListener('input', () => {
        if (!Number.isFinite(audioPlayer.duration) || audioPlayer.duration <= 0) {
            return;
        }

        audioPlayer.currentTime = (Number(playerProgress.value) / 100) * audioPlayer.duration;
        updatePlayerTimes();
    });

    audioPlayer.addEventListener('play', () => setPlayerPlaying(true));
    audioPlayer.addEventListener('pause', () => setPlayerPlaying(false));
    audioPlayer.addEventListener('ended', () => setPlayerPlaying(false));
    audioPlayer.addEventListener('loadedmetadata', updatePlayerTimes);
    audioPlayer.addEventListener('timeupdate', updatePlayerTimes);
}

renderLibrary();
renderFeaturedWorks();
bindBlogArticleToc();
bindStaticBlogDetailChrome();
bindLibraryPanelToggle();
restoreLibraryScroll();
bindLibrarySections();
bindLibraryScroll();
bindLibrarySearch();
bindPlaylist();
