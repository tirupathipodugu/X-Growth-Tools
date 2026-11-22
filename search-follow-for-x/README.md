# Search & Follow for X

A Chrome extension: type a topic, it opens X's People search results and follows matching accounts one at a time, with random 8–25 s gaps, per-run and daily caps, and an automatic stop on any warning from X.

## Download & install

**[⬇ Download search-follow-for-x.zip](https://github.com/tirupathipodugu/X-Growth-Tools/releases/latest/download/search-follow-for-x.zip)** (latest version)

1. Download the ZIP above and unzip it to a folder you'll keep (Chrome loads it from there).
2. Open `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick the unzipped folder (the one containing `manifest.json`).
4. Pin the extension, click it, type a topic and press **Start**.

Tip: try your first run with "Follows this run" set to 2.

## Install from source (development)
1. `chrome://extensions` → turn on **Developer mode**.
2. **Load unpacked** → choose this folder.

## Build for the Chrome Web Store
```powershell
./build.ps1   # → dist/search-follow-for-x-<version>.zip
```
Everything needed for the submission form (description, permission justifications, images, privacy policy) is in `store/` — start with `store/LISTING.md`.

## Files
| File | Purpose |
|---|---|
| `manifest.json` | MV3 manifest; only the `storage` permission |
| `popup.html` / `popup.js` | Settings, Start/Stop, live log |
| `content.js` | Runs on `x.com/search*`, does the following |
| `icons/` | Extension icons |
| `store/` | Listing text, screenshot, promo tile, privacy policy (and the HTML used to render the images) |

Not affiliated with X Corp.
