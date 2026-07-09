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

The app can show real public posts without paid API access by using X's public embedded timeline.

Optionally create `.env.local` for X API v2 data if your developer app has read access:

```bash
X_BEARER_TOKEN=your_x_api_bearer_token_here
```

Restart `npm.cmd run dev` after adding or changing the token.

When API access is available, the app fetches live posts by:

- resolving the entered username through X API v2
- loading that user's recent original posts
- excluding replies and reposts for a cleaner timeline

When no token is configured, or when X returns `402 Payment Required`, the app falls back to the public embedded timeline for that username.
