# React + Vite

## API configuration

For local development, run the backend on port 5000 and use `VITE_API_URL=/api`.
The Vite development server proxies `/api` and `/uploads` requests to that backend.
Production builds use the deployed API at `https://hiking-trail-explorer-backend.onrender.com/api`
by default. If deploying another backend, set `VITE_API_URL` to its full API URL ending in
`/api` in the frontend host's build environment. A relative `/api` value is ignored in
production because it would point to the static frontend host instead of the backend.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
