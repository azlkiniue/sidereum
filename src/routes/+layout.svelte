<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { registerSW } from 'virtual:pwa-register';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';

	let { children } = $props();

	onMount(() => {
		registerSW({ immediate: true });
	});
</script>

<ModeWatcher defaultMode="dark" />
<Toaster richColors closeButton position="bottom-right" />

{@render children()}
