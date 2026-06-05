<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { data } from '$lib/stores/data.svelte';
	import LoginScreen from '$lib/components/LoginScreen.svelte';
	import AppShell from '$lib/components/AppShell.svelte';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';

	let booting = $state(true);

	onMount(async () => {
		await data.init(); // hydrate the local cache (fast, offline-friendly)
		await auth.init(); // revalidate a saved token, if any
		booting = false;
		// Dev-only debug handle (stripped from production builds).
		if (import.meta.env.DEV) (window as unknown as { __sidereum: unknown }).__sidereum = { auth, data };
	});
</script>

<svelte:head>
	<title>Sidereum — organize your GitHub stars</title>
</svelte:head>

{#if booting}
	<div class="flex min-h-svh items-center justify-center">
		<LoaderCircle class="text-muted-foreground size-6 animate-spin" />
	</div>
{:else if auth.isAuthenticated}
	<AppShell />
{:else}
	<LoginScreen />
{/if}
