# Personal Site Redesign Design

Date: 2026-07-01

## Goal

Redesign the personal homepage into a mature, concise personal website for "宵宵". The site should feel like a polished personal profile rather than a loose collection of cards, while preserving the existing writing library, reader experience, music section, and contact paths.

The selected direction is "mature integrated profile": technology, writing, poetry, music, and personal interests all remain visible, but the homepage should establish a clear hierarchy and a calmer visual language.

## Current Context

The project is a static Jekyll/GitHub Pages site. The important existing pieces are:

- `index.html`: homepage content and playlist markup.
- `_includes/library-panel.html`: reusable writing-library sidebar.
- `_layouts/ocean.html`: base layout and metadata.
- `assets/css/site.css`: shared visual system for homepage, reader pages, and library.
- `assets/js/home.js`: library rendering, featured works, article table of contents, playlist controls, and contact copying.
- `assets/data/works.js`: source of truth for works, sections, featured cards, links, tags, and summaries.

The redesign should keep this static architecture unless the existing structure blocks a substantially better result.

## Design Direction

Use a clean editorial profile style:

- White and near-white surfaces, restrained borders, and soft shadows.
- Dark ink text with subtle blue and muted red accents.
- Fewer decorative effects than the current ocean-card look.
- More deliberate spacing, stronger headings, and clearer scan paths.
- A first viewport that immediately communicates identity, technical background, writing focus, and primary actions.

The homepage should look suitable as a personal site shared with classmates, teachers, interviewers, friends, and readers.

## Homepage Structure

1. Top navigation
   - Lightweight horizontal navigation with anchors for works, about, music, and contact.
   - Keep the name/brand visible as the first signal.
   - On smaller screens, allow compact wrapping or a simple stacked layout.

2. Hero section
   - Left side: name, short identity line, concise personal introduction, and primary actions.
   - Right side: avatar, identity highlights, technical direction, and quick facts.
   - Primary actions should include featured reading, library, GitHub, and email.

3. Featured works
   - Continue rendering from `works.js` featured entries.
   - Cards should read as mature recommendations, with section metadata, title, summary, tags, and a clear reading affordance.

4. Content map
   - Keep Blog, Poem, and Articles as the three top-level content categories.
   - Use concise descriptions and clear links.
   - Make this feel like navigation, not decoration.

5. About and skills
   - Present school, major, current stage, technical stack, and writing interests.
   - Keep the tone honest and personal, not like an exaggerated resume.
   - Use grouped information instead of long paragraphs where scanning helps.

6. Music and life
   - Keep the playlist and mini player.
   - Reduce visual weight so music adds personality without competing with works and profile content.

7. Contact and footer
   - Preserve email, GitHub, and QQ copy behavior.
   - Use a simple footer with license text.

## Library Sidebar

The writing library remains a core site feature.

- Preserve search, section folding, active work indication, and scroll restoration.
- Restyle it to match the calmer profile system.
- On desktop, keep it available without dominating the homepage.
- On mobile, make it a compact expandable library control near the top.

## JavaScript and Framework Decision

The redesign is not required to stay with the current JS if that prevents a beautiful, mature result. However, the default implementation should keep the existing static Jekyll site and native JavaScript because the current behavior is small, local, and already tested.

Use a larger rewrite or framework only if it clearly improves maintainability, visual quality, or interaction polish enough to justify the added complexity.

Expected default:

- Keep `assets/js/home.js` as the interaction layer.
- Refactor small pieces only if the new markup requires it.
- Keep `works.js` as the content data source.
- Avoid introducing build tooling beyond the existing Jekyll workflow.

## Responsive Behavior

- Desktop: navigation and hero should feel spacious; library can remain a fixed or prominent companion element.
- Tablet: hero and cards should reduce cleanly to one or two columns.
- Mobile: no horizontal overflow, no text overlap, no oversized controls, and the library should not cover the page by default.

## Accessibility

- Preserve semantic headings, landmark roles, link text, and button labels.
- Keep focus-visible styles clear.
- Ensure interactive controls are keyboard reachable.
- Maintain usable color contrast across cards, buttons, navigation, and player controls.

## Testing and Verification

Minimum verification:

- Run the existing Node tests for `assets/js/home.test.mjs`.
- Build the Jekyll site if dependencies are available.
- Inspect the homepage manually at desktop and mobile widths.
- Verify no layout overlap, broken links from the homepage, or broken playlist controls.
- Verify the writing library search, fold state, active item, and mobile toggle still work.

## Non-Goals

- Do not turn the site into a heavy SPA unless required by design quality.
- Do not replace the existing reader system unless the homepage change exposes a specific problem.
- Do not add unrelated pages, analytics, comments, accounts, or backend behavior.
- Do not make the homepage a marketing landing page with oversized promotional sections.

