# conduit-tech-backbone

Documentation and schematics for church technical infrastructure.

## Live diagram

Once GitHub Pages is enabled for this repo, the interactive signal-flow
diagram is available at:

> `https://crossroadsedison.github.io/conduit-tech-backbone/`

### Enabling GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Pick the `main` branch and the `/ (root)` folder.
5. Save. The site will be served from `index.html` at the repo root.

The `.nojekyll` file is included so the `assets/` folder is served as-is.

## Using the diagram

- **Click a device or cable** to see details in the side panel.
- **Click a flow in the legend** (or press `1`–`8`) to highlight just that
  signal path while dimming the rest. `0` or **Show all** resets it.
- **Scroll / pinch** to zoom, **drag** to pan, **Reset view** or `Esc` to
  recenter.

### Flows

Every device shows its **inputs** and **outputs** in the side panel when
clicked. Flows are colour-coded and grouped by purpose.

**Video**

| Key | Flow | Source → Destination |
| --- | --- | --- |
| 1 | HDMI · Program → TV1 / TV2 | Computer 2 → HDMI Switch → TV1, TV2 |
| 2 | HDMI · Visuals → LED Wall  | Computer 1 → LED Wall |
| 3 | NDI · Lyrics               | Computer 1 → Computer 2 (over LAN) |
| 4 | NDI · BibleShow (internal) | BibleShow → Program app (both on Computer 2) |
| 5 | HDMI · Prompter → TV3      | Computer 1 → TV3 |

**Audio** — the goal is the *Mixer → Speakers* path; everything else feeds it or branches off it.

| Key | Flow | Source → Destination |
| --- | --- | --- |
| 6 | Mics / Instruments → Mixer | Stage sources → Sound Mixer inputs |
| 7 | Mixer → Speakers           | Sound Mixer main out → FOH Speakers (the audio that reaches the congregation) |
| 8 | Mixer → Computer 1 (USB-C) | Sound Mixer USB → Computer 1 (recording / streaming) |

## Files

- `index.html` — the page itself (entry point for GitHub Pages).
- `assets/style.css` — diagram styles.
- `assets/diagram.js` — interaction (highlighting, pan/zoom, details).
- `.nojekyll` — disables Jekyll on Pages so assets paths just work.

