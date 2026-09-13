# Visual preview

Start the frontend with `npm run dev`, then open
`http://localhost:5173/tests/responsive.html?screen=/bet`.

The preview renders the real components with local fixtures; it does not call
the backend. It is not included in the production build. The temporary preview
session is restored when leaving the page. Use a dedicated browser tab.

Available `screen` values: `/login`, `/`, `/bet`, `/game`, `/result`, `/admin`,
`/loading`. Flight is frozen so that levels, chest and controls can be inspected.
Use the buttons on the theme/bet pages to inspect rules and history.

Check portrait and landscape, scrolling to the bottom, panel collapse/reopen,
modal close/navigation and keyboard focus. Representative viewports:
320×568, 390×844, 768×1024, 844×390, 1366×768, 2560×1440.

This fixture validates presentation only, not server authorization, WebSockets
or payouts. Run the regular game tests separately for the model.
