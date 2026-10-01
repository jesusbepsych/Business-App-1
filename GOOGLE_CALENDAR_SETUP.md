# Google Calendar setup

The application code is ready. These steps must be completed by the owner of the Google Cloud project because they create credentials that must never be committed or shared in the app files.

## 1. Test locally

1. In Google Cloud Console, create a project for Business Ledger development.
2. Enable **Google Calendar API**.
3. Open **Google Auth Platform** and configure the app as **External**.
4. Add your email as a test user.
5. Add these scopes:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/calendar.events.readonly`
   - `https://www.googleapis.com/auth/calendar.calendarlist.readonly`
6. Create an **OAuth client → Web application**.
7. Add this authorized redirect URI:

   `http://localhost:3000/oauth/google/callback`

8. Copy `.env.example` to a new file named `.env`.
9. Paste the client ID and client secret into `.env`.
10. Replace `CALENDAR_ENCRYPTION_KEY` with a long random value. A convenient command is:

   `openssl rand -hex 32`

11. From this folder, run `npm start`, then open `http://localhost:3000`.
12. Press **Choose a business → Continue with Google**.

## 2. Publish it

GitHub Pages can host the visual app, but it cannot run `server.mjs`. Calendar connection therefore requires a Node-capable host such as Google Cloud Run, Render, Railway, Fly.io, or an equivalent service.

On the chosen host:

1. Set `APP_ORIGIN` to the final HTTPS address, such as `https://app.example.com`.
2. Set `GOOGLE_REDIRECT_URI` to `https://app.example.com/oauth/google/callback`.
3. Add all four secret values from `.env` as private environment variables.
4. Give `CALENDAR_DATA_DIR` a private persistent disk location, or move the connection store to the production database before a multi-instance launch.
5. Add the production callback URI to the Google OAuth web client.

## 3. Prepare for public users

Before removing Google's test-user restriction:

1. Verify the application's domain in Google Search Console.
2. Publish a home page and privacy policy on that domain.
3. Complete Google brand and data-access verification for the requested Calendar scopes.
4. Test connecting, changing accounts, recurring events, all-day events, calendar selection, revoked access, and disconnect.

Do not upload `.env`, `.data/calendar-connections.json`, the Google client secret, or the calendar encryption key to GitHub.
