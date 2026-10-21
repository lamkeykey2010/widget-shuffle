# Widget Shuffle

A browser puzzle about making a little room. Draw rectangles around app icons and watch them unfold into widgets.

**Play:** https://lamkeykey2010.github.io/widget-shuffle/

## Ten screens

All levels use the same Shikaku rules: exactly one app per rectangle, rectangle area equals its badge, no overlaps or gaps. Every fixed board has a unique solution, independently checked by a second exact-cover verifier.

| Level | Screen | Grid | Apps | Guide |
| --- | --- | --- | --- | --- |
| 1 | First Screen | 4 × 6 | 6 | Intro |
| 2 | Quiet Morning | 4 × 6 | 6 | Easy |
| 3 | Room to Grow | 5 × 6 | 7 | Easy |
| 4 | Little Routine | 5 × 7 | 8 | Medium |
| 5 | Fresh Start | 6 × 7 | 9 | Medium |
| 6 | In the Flow | 6 × 8 | 10 | Hard |
| 7 | Every Little Space | 6 × 8 | 10 | Hard |
| 8 | A Full Day | 8 × 7 | 12 | Hard |
| 9 | Think Ahead | 9 × 8 | 14 | Expert |
| 10 | Everything in Its Place | 8 × 10 | 15 | Expert |

Difficulty labels are provisional guides. Boards were selected using candidate ambiguity and deduction/search behavior under the same authoring solver. These measures are not human playtest ratings. The larger screens are more comfortable on desktop or tablet. On small screens, widgets show compact summaries and full descriptions below the board.

Levels 1 to 5 use portrait phone frames. Levels 6, 7 and 10 use portrait tablet frames. Levels 8 and 9 use landscape tablet frames. Device shape and orientation are fixed by the level, with no rotation toggle. Landscape boards transpose the authored portrait geometry, preserving their solution uniqueness and rules.

## Play

Drag between opposite corners, or tap the two corners. A widget can grow around any position of its original app icon. Hover over an expanded widget to reveal the central **Shrink** button. On touch screens, tap the widget to reveal it. Shrinking returns only that app to its original icon, and Undo restores it.

Tab and arrow keys navigate the grid. Enter or Space select corners. Delete on an occupied cell shrinks its widget. The centre Shrink buttons also support keyboard focus. Escape cancels selection.

Progress is saved separately per level in local browser storage. Completed-screen records remain available when replaying. Best records prefer fewer hints, then faster time, then fewer moves. Undo does not refund used hints or elapsed time. Hints, shrinking and Undo count as moves. Invalid rectangle attempts do not count. Sharing copies the completed layout, time, hint count and a link to the same level. A manual-copy fallback is available when clipboard access is blocked.

All levels are available from the start. There is no daily generator, leaderboard, account, backend, advertising or analytics. App content is fictional. Browser storage availability determines whether progress survives reloads.

## Run locally

Requires Node.js 22 or newer. No dependencies or secret keys.

```text
npm test
npm run build
npm run preview
```

Open the Local URL printed by the preview server. The preview serves the same `/widget-shuffle/` path used on GitHub Pages. The build produces `dist/index.html`, `dist/icon.svg` and `dist/.nojekyll`. The game logic and styles are bundled into the HTML.

Editable sources are in `src/`. `src/levels.mjs` contains the ten fixed boards, without embedded solutions. Tests independently verify uniqueness, invalid moves, saved-state validation and progression. `scripts/difficulty.mjs` is an authoring analyzer and is not included in the deployed site.

## Publish

Push to `main`. `.github/workflows/pages.yml` runs the tests, builds the static site and deploys `dist/` to GitHub Pages. Repository Pages settings must use GitHub Actions. The workflow needs only the standard GitHub-provided token and uses no personal credentials in the repository.

## Privacy

The game does not make API requests. Local progress stays in the visitor's browser. Sharing happens only when the visitor chooses Share result and then pastes or sends it. Hosting the files on GitHub Pages necessarily uses GitHub's infrastructure. No client-side telemetry is added.
