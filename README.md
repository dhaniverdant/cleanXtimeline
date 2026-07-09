# Clean X Timeline

A focused Next.js app that shows only the public posts from a selected X username.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- X API v2 through a private server route

## Getting started

```bash
npm.cmd install
npm.cmd run dev
```

Create `.env.local` for live X data:

```bash
X_BEARER_TOKEN=your_x_api_bearer_token_here
```

Restart `npm.cmd run dev` after adding the token. Without a token, the app runs in demo mode so you can inspect the UI immediately.

The app fetches live posts by:

- resolving the entered username through X API v2
- loading that user's recent original posts
- excluding replies and reposts for a cleaner timeline
