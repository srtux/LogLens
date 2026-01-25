# LogLens Chrome Extension Instructions

LogLens is configured to be built as a Chrome Extension that automatically detects and formats JSON log dumps on any webpage.

## 1. Build the Extension

To generate the extension files, run the build script:

```bash
npm run build
```

This will create a `dist` directory containing:
- `manifest.json`
- `assets/content.js`
- `assets/content.css`
- Other assets

## 2. Load into Chrome

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** (toggle in the top right corner).
3.  Click **Load unpacked**.
4.  Select the `dist` directory inside your project folder.

## 3. How to Use

1.  Navigate to any URL that displays a raw JSON array of log entries (e.g., a `.json` file or an API endpoint).
2.  LogLens will automatically detect the JSON structure (must start with `[` and end with `]`).
3.  If detected, it will overlay the LogLens UI on top of the raw text.
4.  You can click the **X** button in the top right to close the viewer and see the raw text.

## Troubleshooting

-   **Not activating?** Ensure the page content is a valid JSON array starting with `[` and ending with `]`. The detection logic is in `src/content/detector.tsx`.
-   **Styling issues?** Check if `assets/content.css` is correctly loaded in the Network tab of DevTools.
