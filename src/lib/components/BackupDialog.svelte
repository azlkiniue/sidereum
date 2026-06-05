<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { auth } from '$lib/stores/auth.svelte';
	import { data } from '$lib/stores/data.svelte';
	import { downloadBackup, importBackup, parseBackup, type ImportMode } from '$lib/backup/export';
	import { pullFromGist, pushToGist } from '$lib/backup/gist';
	import type { BackupFile } from '$lib/types';
	import { toast } from 'svelte-sonner';
	import Download from '@lucide/svelte/icons/download';
	import Upload from '@lucide/svelte/icons/upload';
	import Cloud from '@lucide/svelte/icons/cloud';
	import CloudUpload from '@lucide/svelte/icons/cloud-upload';
	import CloudDownload from '@lucide/svelte/icons/cloud-download';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';

	let { open = $bindable() }: { open: boolean } = $props();

	let fileInput: HTMLInputElement;
	let pending = $state<BackupFile | null>(null);
	let busy = $state(false);
	let gistIdInput = $state('');

	const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

	async function onFile(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		try {
			pending = parseBackup(await file.text());
		} catch (e) {
			toast.error(errMsg(e));
		}
	}

	async function applyImport(mode: ImportMode) {
		if (!pending) return;
		busy = true;
		try {
			const res = await importBackup(pending, mode);
			await data.init();
			toast.success(`Imported ${res.tags} tags and ${res.meta} notes.`);
			pending = null;
		} catch (e) {
			toast.error(errMsg(e));
		} finally {
			busy = false;
		}
	}

	async function doExport() {
		await downloadBackup();
		toast.success('Backup downloaded.');
	}

	async function createGist() {
		if (!auth.token) return;
		busy = true;
		try {
			const id = await pushToGist(auth.token, null);
			await data.setGistId(id);
			await data.markSynced();
			toast.success('Private backup gist created.');
		} catch (e) {
			toast.error(errMsg(e));
		} finally {
			busy = false;
		}
	}

	async function pushNow() {
		if (!auth.token || !data.settings.gistId) return;
		busy = true;
		try {
			await pushToGist(auth.token, data.settings.gistId);
			await data.markSynced();
			toast.success('Pushed to gist.');
		} catch (e) {
			toast.error(errMsg(e));
		} finally {
			busy = false;
		}
	}

	async function pullNow() {
		if (!auth.token || !data.settings.gistId) return;
		busy = true;
		try {
			const b = await pullFromGist(auth.token, data.settings.gistId, 'replace');
			await data.init();
			toast.success(`Pulled ${b.tags.length} tags and ${b.meta.length} notes.`);
		} catch (e) {
			toast.error(errMsg(e));
		} finally {
			busy = false;
		}
	}

	async function connectGist() {
		const id = gistIdInput.trim();
		if (!auth.token || !id) return;
		busy = true;
		try {
			const b = await pullFromGist(auth.token, id, 'merge');
			await data.setGistId(id);
			await data.init();
			await data.markSynced();
			toast.success(`Connected — merged ${b.tags.length} tags and ${b.meta.length} notes.`);
			gistIdInput = '';
		} catch (e) {
			toast.error(errMsg(e));
		} finally {
			busy = false;
		}
	}

	async function disconnectGist() {
		await data.setGistId(null);
		await data.setAutoSync(false);
		toast.success('Disconnected. The gist itself was not deleted.');
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Backup &amp; sync</Dialog.Title>
			<Dialog.Description>
				Tags and notes live in this browser. Back them up to a file, or to a private gist that
				follows you across devices.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-5">
			<!-- File backup -->
			<div class="space-y-2">
				<h3 class="text-sm font-medium">File</h3>
				<div class="flex gap-2">
					<Button variant="outline" size="sm" onclick={doExport}>
						<Download /> Export JSON
					</Button>
					<Button variant="outline" size="sm" onclick={() => fileInput.click()}>
						<Upload /> Import JSON
					</Button>
					<input
						bind:this={fileInput}
						type="file"
						accept="application/json,.json"
						class="hidden"
						onchange={onFile}
					/>
				</div>
				{#if pending}
					<div class="bg-muted/50 space-y-2 rounded-md border p-3 text-sm">
						<p>
							Found <b>{pending.tags.length}</b> tags and <b>{pending.meta.length}</b> notes{pending.exportedAt
								? ` (exported ${new Date(pending.exportedAt).toLocaleString()})`
								: ''}.
						</p>
						<div class="flex flex-wrap gap-2">
							<Button size="sm" onclick={() => applyImport('merge')} disabled={busy}>Merge</Button>
							<Button size="sm" variant="destructive" onclick={() => applyImport('replace')} disabled={busy}>
								Replace all
							</Button>
							<Button size="sm" variant="ghost" onclick={() => (pending = null)}>Cancel</Button>
						</div>
					</div>
				{/if}
			</div>

			<Separator />

			<!-- Gist sync -->
			<div class="space-y-3">
				<div>
					<h3 class="flex items-center gap-1.5 text-sm font-medium">
						<Cloud class="size-4" /> Gist cloud sync
					</h3>
					<p class="text-muted-foreground text-xs">
						Stores the same backup in a private GitHub gist (requires the
						<code class="bg-muted rounded px-1">gist</code> token scope).
					</p>
				</div>

				{#if data.settings.gistId}
					<div class="space-y-3 rounded-md border p-3">
						<div class="flex items-center justify-between gap-2 text-sm">
							<a
								href={`https://gist.github.com/${data.settings.gistId}`}
								target="_blank"
								rel="noreferrer"
								class="text-primary inline-flex items-center gap-1 hover:underline"
							>
								Connected gist <ExternalLink class="size-3" />
							</a>
							{#if data.settings.lastSyncedAt}
								<span class="text-muted-foreground text-xs">
									Synced {new Date(data.settings.lastSyncedAt).toLocaleString()}
								</span>
							{/if}
						</div>
						<div class="flex flex-wrap gap-2">
							<Button size="sm" variant="outline" onclick={pushNow} disabled={busy}>
								<CloudUpload /> Push
							</Button>
							<Button size="sm" variant="outline" onclick={pullNow} disabled={busy}>
								<CloudDownload /> Pull
							</Button>
							<Button size="sm" variant="ghost" onclick={disconnectGist} disabled={busy}>
								Disconnect
							</Button>
						</div>
						<label class="flex items-center gap-2 text-sm">
							<Checkbox
								checked={data.settings.autoSync}
								onCheckedChange={(v) => data.setAutoSync(v === true)}
							/>
							Auto-push after each change
						</label>
					</div>
				{:else}
					<div class="space-y-3">
						<Button size="sm" onclick={createGist} disabled={busy || !auth.token}>
							{#if busy}<LoaderCircle class="animate-spin" />{:else}<CloudUpload />{/if}
							Create backup gist
						</Button>
						<div class="flex items-end gap-2">
							<div class="flex-1 space-y-1">
								<Label class="text-xs" for="gistid">…or connect an existing gist id</Label>
								<Input id="gistid" bind:value={gistIdInput} placeholder="e.g. a1b2c3d4…" class="h-8" />
							</div>
							<Button size="sm" variant="outline" onclick={connectGist} disabled={busy || !gistIdInput.trim()}>
								Connect
							</Button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
