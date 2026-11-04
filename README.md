# shift-calendar

Apple Calendar subscription feed for a shift rotation, paydays and city holidays.

- Feed: `webcal://risky1313.github.io/shift-calendar/work-shifts.ics`
- Page: https://risky1313.github.io/shift-calendar/
- `gen.js` builds the feed with the same rules as the Shift Schedule app. A GitHub Action reruns it on the 1st of each month so the next year is always included.

## The app website

`index.html` is the full Shift Schedule app (https://risky1313.github.io/shift-calendar/). It's built by `node build.js` from `app-src.html`, which is the same page that runs as the Claude artifact. `web.js` gives it Firebase sign-in (email/password) and Firestore sync, and stores data under `users/<uid>/`. Paste `firestore.rules` into Firestore › Rules. The Firebase web config goes in `firebase-config.js`.
