import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const rawBasePath = process.env.BASE_PATH ?? '';
const basePath = rawBasePath === '' ? '/' : rawBasePath.endsWith('/') ? rawBasePath : `${rawBasePath}/`;

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
				navigateFallback: 'index.html',
				navigateFallbackDenylist: [/^\/api\//],
				runtimeCaching: [
					{
						urlPattern: ({ request }) => request.mode === 'navigate',
						handler: 'NetworkFirst',
						options: {
							cacheName: 'sidereum-pages',
							networkTimeoutSeconds: 5
						}
					},
					{
						urlPattern: /\/_app\//,
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'sidereum-app-assets'
						}
					}
				]
			}
		})
	]
});
