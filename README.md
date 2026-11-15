# aisoftwarefactory.cz

The site at [aisoftwarefactory.cz](https://aisoftwarefactory.cz): Forge, Cognera's AI software factory, and its modules.
Czech at the root, English under `/en/`.

It is a static site. GitHub Pages serves this repository's `main` branch as it is, so the pages in the root are
**generated files**. Do not edit them by hand: change the source under `src/` and build.

## Work on it

Node 20 or newer; no dependencies to install.

```sh
node build.mjs          # render src/ into the pages, assets/site.css, sitemap.xml, robots.txt, favicon.svg
node build.mjs --check  # fail if a generated file differs from a fresh build
npm test                # unit tests, the visual contract, the built pages, the copy rules
npm run serve           # http://localhost:4173 (serve.mjs: right content types and byte ranges, 404.html for unknown paths)
```

A change is ready when `npm test` passes; one of its tests is the `--check` above, so forgetting to build fails it.

## Layout

| Path | What it is |
|---|---|
| `src/i18n/` | The languages, each page's address in each language, the language of the render in progress |
| `src/content/` | Every sentence, link and picture description: Czech modules, `en/` for English, `index.mjs` for both |
| `src/components/` | One function per component; each returns HTML |
| `src/pages/` | The pages, composed from components; `index.mjs` renders each in each language |
| `src/styles/` | `tokens.css` (every visual value), `base.css`, then one file per component |
| `src/layout.mjs` | The document shell: head, navigation, main, footer |
| `assets/js/` | Progressive enhancement only; every page reads and works without scripts. `scenes/` holds the scroll scenes' frame manifests |
| `assets/media/scenes/` | The scroll scenes' frames: the assembly (the modules page), and the line in Czech and English (91 MB; a visitor loads 3 to 4 MB of one scene). No page uses the line's frames any more: the home page tells the line as a live story |
| `assets/media/film/`, `assets/media/3d/` | The 3D films and object renders |
| `assets/media/screens/` | Real product screens on demo data; `forge-plan` is a crop of `forge-step-b` without the task's status bar |
| `assets/media/references/` | The pictures of the systems built in the factory (the home page's proof section): the same files cognera.cz serves for its case studies |
| `assets/js/story.js`, `assets/js/story-math.js` | The scroll story: the pinned stage, the spring, the layers. Told twice by `src/components/module-story.mjs`: the modules on `/moduly/` (three steps a chapter) and the line's five steps with Forge on the home page (two steps a chapter) |
| `assets/js/stack.js` | The deck of systems on the home page: measures how far each card is covered and how far it is from its place; the styles do the rest |
| `assets/js/story-canvas.js`, `assets/media/story/` | Generated: the story's 3D canvas (three.js, React Three Fiber, React; 366 kB gzip, loaded only when the story is a screen away) and its models and textures. Do not edit; it is rebuilt from the scenes' source outside this repository |
| `assets/js/lang.js`, `src/lib/lang-switch.mjs`, `src/styles/lang-transition.css` | Switching language: the link carries the visitor's place, the other page restores it before its first paint, and where the browser can the two pages cross-fade. `lang-switch.mjs` holds the three scripts written into every page (the head, after the story, the end of the body) |
| `tests/` | `node --test`; `tests/lib/` holds the checkers |
| `index.html`, `forge/`, `moduly/`, `provozovatel/`, `en/`, `404.html`, `assets/site.css`, `sitemap.xml`, `robots.txt`, `favicon.svg` | Generated |

## Rules the tests enforce

- **Visual contract.** Font sizes come from the named text styles (`display-*` and `ghost-*` for the largest type),
  spacing from the thirteen spacing tokens, radii and timing from their tokens; backgrounds are flat; no italics; no
  one-sided borders.
- **Touch.** On coarse pointers every link and button is at least 44 px tall to the finger (invisible `::after` areas
  or padding, the look unchanged); below 768 px no labelling text is under 14 px. `tests/touch.test.mjs` keeps the
  rules; every hand-written script must parse (`tests/scripts-load.test.mjs`).
- **The look.** The page is the studio plate of the renders and screens (`--bg`), so films and 3D objects stand on it
  without a frame; one accent, the ember (`--accent`), marks place: captions, a chapter's number, the chapter on stage.
- **Nothing from another origin.** No cookies, no analytics, no third-party request. The page `/provozovatel/` says
  so, and the tests keep it true. Two scripts fetch, only from this site: the scroll scenes' frames and the story
  canvas's models and textures. XML namespace names in the canvas (SVG, MathML) are identifiers, never requested.
- **Two languages, one shape.** English content has exactly the keys, lists and pictures of the Czech content; every
  page names its language versions (`hreflang`) and the bar leads to the same page in the other language.
- **The switch keeps the place.** The language link carries the number of the section on screen and the share of it
  already passed, in the address's fragment (`#@1:0.612`), removed on arrival. So both languages have the same
  sections in the same order, a page has at most one scroll scene and one story, and the scripts written into the
  pages follow the same rules as the files: nothing stored, nothing sent.
- **Every page** has one `h1`, a unique title, a description, a canonical address, a skip link, described pictures
  with their sizes, and links and anchors that resolve.
- **Copy.** No dashes, no hyphens in Czech sentences, no AI vendor or model names, no metrics, no filler words, in
  either language. Forge has modules, not tools.
- **One action.** Every primary button is the same label and address (`PRIMARY_ACTION` in `src/content/site.mjs`).

## Add a language

Add it to `LOCALES` and to every route in `src/i18n/index.mjs`, add its content beside `src/content/en/` and to
`src/content/index.mjs`, its line scene frames and manifest (`assets/js/scenes/line-<code>.js`) and its share picture.
`tests/i18n.test.mjs` then tells what is missing.

## Third parties

See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md): the Manrope typeface (SIL Open Font License 1.1) and Phosphor
icons (MIT).

© Cognera s.r.o.
