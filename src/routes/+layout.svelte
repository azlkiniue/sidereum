<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';

	let { children } = $props();
</script>

<ModeWatcher defaultMode="dark" />
<Toaster richColors closeButton position="bottom-right" />

{@render children()}
