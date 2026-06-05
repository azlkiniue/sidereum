# ⭐ Sidereum

Organize your GitHub stars with **tags**, **notes**, and **smart filters** — 100% in your
browser. A self-hostable, backend-free alternative to [Astral](https://github.com/astralapp/astral).

No server. No database. No tracking. Your data lives in your browser (IndexedDB) and is yours to
export at any time. Deploy it to GitHub Pages or Cloudflare Pages for free.

## Features

- 🔑 **Bring-your-own token** — authenticate with a GitHub Personal Access Token; calls go
  straight to GitHub's API from your browser.
- 🏷️ **Tags** — organize stars into colored, custom tags.
- 📝 **Notes** — attach Markdown notes to any repository, with live preview.
- ✨ **Smart tags** — auto-assign repositories using rules (language, name, topic, description,
  archived/fork, …) combined with _all_ / _any_ logic.
- 🔎 **Fuzzy search & filters** — search across name, description, owner and topics; filter by
  language; sort by stars, recency, or name.
- 💾 **Backup as a file** — export everything to a JSON file and import it back (merge or replace).
- ☁️ **Optional Gist sync** — back up your tags & notes to a private GitHub Gist so they follow
  you across devices (still 100% client-side).
- 🌓 **Light & dark** themes.

## How it works (and your privacy)

Sidereum is a static single-page app. There is **no backend**:

- Your **token** is stored only in this browser's `localStorage` and is sent **only** to
  `api.github.com`.
- Your **stars cache, tags, and notes** are stored in this browser's **IndexedDB**.
- The only network requests are to GitHub (the REST/GraphQL API, and the Gist API if you enable
  sync).

Because everything is local, clearing your browser data erases your tags and notes — so use the
**Backup** features. The account menu → _Log out_ removes the saved token.

## Quick start

### 1. Create a GitHub token

Open **[github.com/settings/tokens](https://github.com/settings/tokens/new?description=Sidereum&scopes=public_repo,read:user,gist)**
(the link pre-fills the description and scopes) and generate a token with:

| Scope         | Why                                              |
| ------------- | ------------------------------------------------ |
| `read:user`   | read your profile (name / avatar)                |
| `public_repo` | read your starred **public** repos               |
| `repo`        | _(optional)_ also read starred **private** repos |
| `gist`        | _(optional)_ enable private Gist backup/sync     |

> Fine-grained tokens work too — grant read-only access to **Starring** and your user profile
> (and **Gists: read & write** for sync).

### 2. Paste it into Sidereum and you're in.

## Run locally

Requires [Bun](https://bun.sh) (no Node.js needed).

```bash
bun install
bun run dev        # http://localhost:5173
```

Other scripts:

```bash
bun run build      # static production build → ./build
bun run preview    # serve the production build locally
bun run check      # type-check (svelte-check)
```

## Deploy

The production build (`bun run build`) is fully static and written to `build/`.

### GitHub Pages (automated)

A workflow is included at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. Push this repo to GitHub.
2. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Push to `main`. The workflow builds with the correct base path and deploys.

The workflow sets `BASE_PATH=/<repo-name>` so a **project site**
(`https://<you>.github.io/sidereum`) resolves assets correctly. If you deploy to a **root site**
(a `<you>.github.io` repo) or a custom domain, set `BASE_PATH` to an empty string in the workflow.

A `.nojekyll` file is shipped in `static/` so GitHub Pages serves SvelteKit's `_app/` directory.

### Cloudflare Pages

Create a project from this repo with:

- **Build command:** `bun run build`
- **Build output directory:** `build`
- Leave `BASE_PATH` unset (Cloudflare serves from the root).

### Anywhere else

Any static host works — upload the contents of `build/`. For a sub-path deployment, build with
`BASE_PATH=/your/sub/path bun run build`.

## Backup & sync

Open **Backup & sync** (sidebar footer or account menu):

- **Export / Import JSON** — download a portable backup of all tags and notes, or load one back in
  (choose _merge_ or _replace_).
- **Gist cloud sync** — create a private Gist that mirrors your backup, then **Push**/**Pull**
  on demand, or enable **auto-push after each change**. Connect the same Gist on another device to
  carry your tags and notes across browsers.

> Only your tags and notes are stored in the backup — never your token. The star list itself is
> always re-fetched fresh from GitHub.

## Tech stack

- **[Svelte 5](https://svelte.dev) + [SvelteKit](https://kit.svelte.dev)** with
  `adapter-static` (prerendered, `ssr: false` → a pure SPA)
- **[Tailwind CSS v4](https://tailwindcss.com) + [shadcn-svelte](https://shadcn-svelte.com)**
- **[Bun](https://bun.sh)** as package manager & runtime
- **IndexedDB** via [`idb`](https://github.com/jakearchibald/idb)
- **GitHub REST API** (stars via `/user/starred`, plus Gist sync) — the REST API is
  CORS-enabled, which is what lets a browser-only app call it directly
- [`fuse.js`](https://fusejs.io) (search), [`marked`](https://marked.js.org) +
  [`DOMPurify`](https://github.com/cure53/DOMPurify) (notes)

## License

[MIT](LICENSE)
