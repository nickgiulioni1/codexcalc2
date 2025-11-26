# Codex Calc 2

This repo contains a Vite + React single-page app. The project now includes an automated GitHub Pages deployment so the app can be served from a static host without manual builds.

## Local development
1. Install dependencies: `npm ci`
2. Start the dev server: `npm run dev`

## Production build
Run `npm run build`. The optimized static assets are written to the `build/` directory. You can upload that folder to any static host (e.g., Tiiny) to serve the app.

## GitHub Pages deployment
A GitHub Actions workflow at `.github/workflows/deploy.yml` builds the site and deploys it to GitHub Pages:
- Triggers on pushes to `main` or manual dispatches.
- Installs dependencies with `npm ci` and runs `npm run build`.
- Publishes the `build/` output to the `github-pages` environment via `actions/deploy-pages`.

To enable:
1. Push the workflow to GitHub.
2. In the repository settings, enable GitHub Pages with the "GitHub Actions" source.
3. After the workflow runs, the site URL is exposed as the deployment output.

## Deploying to Tiiny
If you want to keep using Tiiny:
1. Run `npm run build` locally or let the CI artifact complete.
2. Upload the contents of `build/` to your Tiiny site and point the domain to that upload.
