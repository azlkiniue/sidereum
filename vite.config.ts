import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const rawBasePath = process.env.BASE_PATH ?? '';
const basePath = rawBasePath === '' ? '/' : rawBasePath.endsWith('/') ? rawBasePath : `${rawBasePath}/`;
const indexPath = `${basePath}index.html`;
const fallbackPath = `${basePath}404.html`;
// The prerendered HTML pages are written after the service worker is generated, so Workbox
// can't hash them, yet they change on every build (SvelteKit's per-build version renames the
// chunks they import). A per-build revision makes each deploy refetch them; `revision: null`
// cached them forever, so after a deploy installed apps loaded stale HTML that imported
// deleted chunks and showed a blank page.
const htmlRevision = Date.now().toString();

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		VitePWA({
			base: basePath,
			scope: basePath,
			registerType: 'autoUpdate',
			strategies: 'generateSW',
			includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
			manifest: {
				id: basePath,
				name: 'Sidereum',
				short_name: 'Sidereum',
				description: 'Organize your GitHub stars with tags and notes. Fully client-side.',
				theme_color: '#111827',
				background_color: '#111827',
				display: 'standalone',
				scope: basePath,
				start_url: basePath,
				icons: [
					{
						src: 'icons/pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'icons/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: 'icons/maskable-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'maskable'
					},
					{
						src: 'icons/maskable-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				cleanupOutdatedCaches: true,
				clientsClaim: true,
				skipWaiting: true,
				navigateFallback: 'index.html',
				additionalManifestEntries: [
					{ url: basePath, revision: htmlRevision },
					{ url: indexPath, revision: htmlRevision },
					{ url: fallbackPath, revision: htmlRevision }
				],
				navigateFallbackDenylist: [/^\/api\//],
				runtimeCaching: [
					{
						urlPattern: ({ request, url }) =>
							request.mode === 'navigate' && url.origin === self.location.origin,
						handler: 'CacheFirst',
						options: {
							cacheName: 'sidereum-pages',
							cacheableResponse: {
								statuses: [200]
							}
						}
					},
					{
						urlPattern: ({ url, request }) =>
							url.origin === self.location.origin && request.destination !== 'document',
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'sidereum-static-assets',
							cacheableResponse: {
								statuses: [200]
							}
						}
					}
				]
			},
			devOptions: {
				enabled: true
			}
		})
	]
});
