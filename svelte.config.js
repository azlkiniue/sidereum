import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Base path lets us deploy to a GitHub Pages *project* site (https://user.github.io/sidereum).
// Set BASE_PATH=/sidereum when building for that; leave empty for Cloudflare Pages / custom domains.
const base = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html', // SPA fallback that also works as the GitHub Pages 404 handler
			precompress: false,
			strict: true
		}),
		paths: {
			base,
			relative: false
		}
	}
};

export default config;
