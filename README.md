# LogLens

A high-performance, developer-friendly log viewer for visualizing structured JSON logs directly in the browser.

## Overview

LogLens is a React-based log explorer designed to parse, visualize, and filter large volumes of JSON logs. It transforms raw JSON log dumps into a structured, interactive terminal-like interface with powerful features like:

-   **Timeline Visualization**: A stacked histogram showing log volume over time, color-coded by severity.
-   **High Performance**: Uses `react-virtuoso` for virtualized rendering, capable of handling thousands of log entries smoothly.
-   **Rich Filtering**: Faceted search by Resource Type, Severity, Log Name, and Labels.
-   **Structured Data View**: Interactive, collapsible JSON tree view for inspecting complex log payloads.
-   **ANSI Color Support**: Renders ANSI escape codes in log messages correctly.
-   **Developer UX**: Dark mode, distinct severity indicators, and keyboard shortcuts (Esc to exit full screen).

## How It Works

1.  **Ingestion**: The application scans the DOM (`document.body.innerText`) for a JSON array containing log entries. This makes it ideal for use as a Chrome extension content script or a standalone viewer for JSON log files served by a web server.
2.  **Parsing**: It parses the JSON data and normalizes it into a standard `LogEntry` format, extracting timestamps, severity levels, and resource labels.
3.  **Indexing**: It builds in-memory indices for facets (Severity, Resource Type, etc.) to enable fast filtering.
4.  **Visualization**:
    *   **Timeline**: Aggregates logs into time buckets to render the histogram.
    *   **List**: Renders the filtered list of logs using windowing (virtualization) to maintain performance.

## Tech Stack

-   **Framework**: [React](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Charts**: [Recharts](https://recharts.org/)
-   **Virtualization**: [react-virtuoso](https://virtuoso.dev/)
-   **Utilities**:
    *   `date-fns` for date manipulation.
    *   `ansi_up` for ANSI color rendering.

## Installation & Development

1.  **Clone the repository**

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  **Build for production**
    ```bash
    npm run build
    ```

## Usage

In development mode (`npm run dev`), the app will load sample data if no logs are found in the DOM. To test with real data, you can replace the content of `src/data/sampleLogs.ts` or serve a JSON file containing an array of log objects.
