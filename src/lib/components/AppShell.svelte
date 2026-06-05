<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { data } from '$lib/stores/data.svelte';
	import Sidebar from './Sidebar.svelte';
	import StarList from './StarList.svelte';
	import StarDetail from './StarDetail.svelte';
	import Star from '@lucide/svelte/icons/star';

	// First time in with a valid token but an empty cache → pull stars from GitHub.
	onMount(() => {
		if (auth.token && data.stars.length === 0 && !data.syncing) data.sync();
	});
</script>

<div class="flex h-svh w-full overflow-hidden">
	<Sidebar />
	<div class="w-[380px] shrink-0 border-r">
		<StarList />
	</div>
	<div class="min-w-0 flex-1">
		{#if data.selected}
			<StarDetail star={data.selected} />
		{:else}
			<div class="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
				<Star class="size-10 opacity-30" />
				<p class="text-sm">Select a repository to view details and add notes.</p>
			</div>
		{/if}
	</div>
</div>
