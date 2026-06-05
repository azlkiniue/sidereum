<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { GITHUB_TOKEN_URL } from '$lib/constants';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Star from '@lucide/svelte/icons/star';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';

	let token = $state('');
	let submitting = $derived(auth.status === 'validating');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!token.trim()) return;
		await auth.login(token);
	}
</script>

<div class="flex min-h-svh items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="mb-8 flex flex-col items-center gap-3 text-center">
			<div class="flex size-14 items-center justify-center rounded-2xl bg-yellow-400/10">
				<Star class="size-8 fill-yellow-400 text-yellow-400" />
			</div>
			<h1 class="text-3xl font-bold tracking-tight">Sidereum</h1>
			<p class="text-muted-foreground text-balance">
				Organize your GitHub stars with tags and notes — entirely in your browser.
			</p>
		</div>

		<form onsubmit={submit} class="bg-card space-y-4 rounded-xl border p-6 shadow-sm">
			<div class="space-y-2">
				<Label for="token">GitHub Personal Access Token</Label>
				<Input
					id="token"
					type="password"
					bind:value={token}
					placeholder="ghp_…"
					autocomplete="off"
					spellcheck={false}
				/>
			</div>

			{#if auth.status === 'error' && auth.error}
				<p class="text-destructive text-sm">{auth.error}</p>
			{/if}

			<Button type="submit" class="w-full" disabled={submitting || !token.trim()}>
				{#if submitting}
					<LoaderCircle class="animate-spin" /> Connecting…
				{:else}
					<svg viewBox="0 0 24 24" fill="currentColor" class="size-4" aria-hidden="true">
						<path
							d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.2 3.44 9.6 8.21 11.16.6.11.82-.25.82-.57 0-.28-.01-1.02-.02-2-3.34.71-4.04-1.58-4.04-1.58-.55-1.36-1.34-1.73-1.34-1.73-1.09-.73.08-.72.08-.72 1.21.08 1.84 1.22 1.84 1.22 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.57-2.67-.3-5.47-1.31-5.47-5.83 0-1.29.47-2.34 1.23-3.17-.12-.3-.53-1.52.12-3.16 0 0 1-.32 3.3 1.21a11.6 11.6 0 0 1 3-.4c1.02 0 2.05.13 3 .4 2.28-1.53 3.29-1.21 3.29-1.21.65 1.64.24 2.86.12 3.16.77.83 1.23 1.88 1.23 3.17 0 4.53-2.81 5.52-5.49 5.81.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.21.69.83.57A12.02 12.02 0 0 0 24 12.29C24 5.78 18.63.5 12 .5Z"
						/>
					</svg>
					Connect to GitHub
				{/if}
			</Button>

			<div class="text-muted-foreground space-y-2 border-t pt-3 text-xs leading-relaxed">
				<p class="text-foreground flex items-center gap-1.5 font-medium">
					<ShieldCheck class="size-3.5 text-emerald-500" /> Stays on your device
				</p>
				<p>
					The token is saved only in this browser and sent straight to GitHub's API — Sidereum has
					no backend.
				</p>
				<p>
					<a
						href={GITHUB_TOKEN_URL}
						target="_blank"
						rel="noreferrer"
						class="text-foreground inline-flex items-center gap-1 underline underline-offset-2"
					>
						Create a token <ExternalLink class="size-3" />
					</a>
					with scopes <code class="bg-muted rounded px-1 py-0.5">read:user</code>,
					<code class="bg-muted rounded px-1 py-0.5">public_repo</code>
					(use <code class="bg-muted rounded px-1 py-0.5">repo</code> for private stars), and
					<code class="bg-muted rounded px-1 py-0.5">gist</code> for cloud backup.
				</p>
			</div>
		</form>
	</div>
</div>
