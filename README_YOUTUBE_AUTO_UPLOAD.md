# HOA — Automatic YouTube Unlisted Upload

This feature changes the admin workflow from:

`Upload to YouTube manually → copy Video ID → add to HOA`

to:

`Select video in HOA Admin → upload → YouTube Unlisted → Video ID → HOA lecture record`

## What is already implemented

- `js/admin-course-student.js` — new admin upload workflow.
- `supabase/functions/youtube-upload/index.ts` — secure server-side OAuth, token refresh, YouTube resumable-upload session creation, verification and HOA lecture creation.
- `db/youtube_upload_automation_v1.sql` — production tables with RLS and browser roles denied.
- The existing manual YouTube Video ID workflow remains available as a fallback.
- Student playback remains unchanged: YouTube Unlisted video IDs are still used by the existing HOA custom player.

## One-time Google Cloud setup

1. Open Google Cloud Console and create/select the project that will own the YouTube API credentials.
2. Enable **YouTube Data API v3**.
3. Create an OAuth 2.0 **Web application** client.
4. Add this exact Authorized redirect URI:

`https://pnzhtiwwqiqnnkecogcc.supabase.co/functions/v1/youtube-upload?action=callback`

5. Keep the client ID and client secret private.
6. Google may require the API project to complete its YouTube API audit before uploaded videos can behave as intended; unverified projects created after July 28, 2020 can have uploaded videos restricted to private viewing until the audit requirement is satisfied.

## Supabase secrets

Set these server-side Edge Function secrets. Do **not** put them in `index.html`, `app.js`, GitHub, or browser localStorage.

- `YOUTUBE_CLIENT_ID` = Google OAuth client ID
- `YOUTUBE_CLIENT_SECRET` = Google OAuth client secret
- `YOUTUBE_TOKEN_SECRET` = a long random secret used to encrypt the YouTube refresh token at rest
- `YOUTUBE_REDIRECT_URI` = `https://pnzhtiwwqiqnnkecogcc.supabase.co/functions/v1/youtube-upload?action=callback`
- `HOA_APP_URL` = `https://hubofaspirants.com`

Example CLI commands:

```bash
supabase secrets set YOUTUBE_CLIENT_ID="YOUR_CLIENT_ID"
supabase secrets set YOUTUBE_CLIENT_SECRET="YOUR_CLIENT_SECRET"
supabase secrets set YOUTUBE_TOKEN_SECRET="GENERATE_A_LONG_RANDOM_SECRET"
supabase secrets set YOUTUBE_REDIRECT_URI="https://pnzhtiwwqiqnnkecogcc.supabase.co/functions/v1/youtube-upload?action=callback"
supabase secrets set HOA_APP_URL="https://hubofaspirants.com"
```

## Admin workflow after setup

1. Open **Admin → Classes & Video Management**.
2. Click **CONNECT YOUTUBE CHANNEL**.
3. Sign in with the Google account that owns/manages the HOA YouTube channel.
4. Approve the requested YouTube permissions.
5. Return to HOA.
6. Select Course, Subject Folder and Class Title.
7. Select the video file.
8. Click **UPLOAD TO YOUTUBE & ADD CLASS**.

The backend creates the YouTube video with:

- Privacy: **Unlisted**
- Embeddable: **Yes**
- Category: **Education**

After YouTube returns the video ID, the backend verifies that the video belongs to the connected channel, is Unlisted and is embeddable, then creates the `batch_lectures` record as a **Draft**.

The admin can then publish it using the existing HOA publish control.

## Security design

- YouTube refresh token is never sent to the browser.
- Refresh token is encrypted before being stored.
- Browser roles have no table privileges for the YouTube connection/upload tables.
- Edge Function requires a valid Supabase JWT and checks `app_admins` role.
- The resumable upload uses a short-lived Google access token held only in browser memory for the active admin upload.
- Student-side code is unchanged.

## Important quota note

YouTube `videos.insert` has a quota cost of 100 units per upload and a default quota of 10,000 units/day, so the default quota allows roughly 100 video uploads per day before quota management is needed.