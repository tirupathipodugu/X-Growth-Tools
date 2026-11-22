# Chrome Web Store submission – copy/paste sheet

## Package
Upload `dist/search-follow-for-x-<version>.zip` (built by `build.ps1`).

## Store listing tab
- **Name:** Search & Follow for X (comes from manifest)
- **Summary:** comes from manifest `description`
- **Category:** Social & Communication
- **Language:** English
- **Store icon:** `icons/icon128.png`
- **Screenshot:** `store/screenshot-1280x800.png`
- **Small promo tile:** `store/promo-440x280.png`
- **Homepage / support URL:** link to the GitHub repo (once published)

### Description
```
Search & Follow for X helps you find and follow people in your niche without clicking through search results one by one.

HOW IT WORKS
1. Click the extension icon and type a topic, e.g. "indie hackers building with AI".
2. Press Start. It opens X's People search results for that topic.
3. It follows matching accounts one at a time, with a random 8–25 second pause between each, and shows a live log.

BUILT TO BE GENTLE
• Follows only accounts in the search results, never sidebar suggestions
• Per-run limit (max 25) and a daily cap you choose
• Skips accounts you already follow, protected accounts and, optionally, accounts with no bio or that aren't verified
• Stops immediately if X shows a warning, a verification check, or a follow doesn't go through
• Stop button to end a run at any time

PRIVACY
No account login, no servers, no tracking. Settings and the activity log are stored only in your browser.

Please use it responsibly and within X's rules. This extension is not affiliated with or endorsed by X Corp.
```

## Privacy practices tab
- **Single purpose:** Search X for a topic the user enters and follow accounts from the People results, at a limited rate.
- **Permission justification – storage:** Saves the user's settings, the current run's progress, today's follow count and the activity log locally.
- **Host permission justification (content script on https://x.com/search\*):** Needed to read the account results on X search pages and click their Follow buttons when the user starts a run. It does not run on any other page.
- **Remote code:** No, I am not using remote code.
- **Data usage:** tick nothing (collects no user data). Certify all three disclosures.
- **Privacy policy URL:** where `store/privacy.html` is hosted (e.g. GitHub Pages).

## Distribution tab
- Visibility: Public (or Unlisted to share by link only)
- Regions: All
- Price: Free

## Releasing an update
1. Bump `version` in `manifest.json`.
2. Run `./build.ps1`.
3. Dashboard → Package → Upload new package → Submit for review.
