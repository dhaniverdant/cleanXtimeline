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

Without a token, the app runs in demo mode so you can inspect the UI immediately.
