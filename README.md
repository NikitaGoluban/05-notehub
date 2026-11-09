# NoteHub — Homework 5

- [Live application](https://05-notehub-eta-three.vercel.app)
- [GitHub repository](https://github.com/NikitaGoluban/05-notehub)

A React and TypeScript application for creating, deleting, and searching personal notes using the GoIT NoteHub API.

## Run locally

Requires Node.js 22.12 or later and npm.

```sh
npm install
```

Copy `.env.example` to `.env.local` and set `VITE_NOTEHUB_TOKEN` to your personal token from the [NoteHub API documentation](https://notehub-public.goit.study/api/docs/). The `POST /auth` endpoint returns the token for your email address. Local environment files are ignored by Git.

```sh
npm run dev
```

## Features and libraries

- Vite, React, and TypeScript with strict type checking.
- Typed Axios services for fetching, creating, and deleting notes.
- TanStack Query for server state, caching, and mutation invalidation.
- React Paginate with 12 notes per page.
- Search debounced by 300ms using `useDebouncedCallback` in `App`.
- Formik and Yup validation: required title of 3–50 characters, optional content up to 500 characters, and one of the five supported tags.
- A reusable portal modal with backdrop/Escape dismissal, focus management, and scroll locking.
- CSS Modules and modern-normalize; component styles adapted from the [assignment styles](https://github.com/goitacademy/react-notehub-styles/tree/8ee43401dae23a7dd7e3165ddb5117d9f8787de7). The current upstream main branch is empty, so the original styles were recovered from commit `8ee4340`.
- Loading, empty, and error states, plus responsive mobile layout.

## Checks

```sh
npm run build
npm run lint
npm run format:check
npm run test:e2e
```

The seven Playwright tests use mocked API responses and a test token. They do not modify your personal notes. Google Chrome must be installed for the configured browser channel.

## Deploy to Vercel

1. Import the `05-notehub` GitHub repository into Vercel.
2. Select the Vite framework preset (build command `npm run build`, output directory `dist`).
3. Add `VITE_NOTEHUB_TOKEN` in the Vercel environment variables before building. Use the value from your local `.env.local`.
4. Deploy. If you add or change the environment variable afterward, redeploy to include it in the Vite build.
5. Verify loading, search, pagination, creation, and deletion on the production site.

Submit the GitHub repository URL and the production domain listed under **Domains** in Vercel. The assignment asks you to wait five minutes after your final GitHub push before submitting in the LMS.
