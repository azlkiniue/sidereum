<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { auth } from '$lib/stores/auth.svelte';
	import { data } from '$lib/stores/data.svelte';
	import Sidebar from './Sidebar.svelte';
	import StarList from './StarList.svelte';
	import StarDetail from './StarDetail.svelte';
	import TagDialog from './TagDialog.svelte';
	import BackupDialog from './BackupDialog.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { buttonVariants } from '$lib/components/ui/button';
	import type { Tag } from '$lib/types';
	import Star from '@lucide/svelte/icons/star';

	let sidebarOpen = $state(false);

	// Dialog state lives here, not in Sidebar: on phones the sidebar is an off-canvas drawer
	// that unmounts when it closes, so a dialog owned by it would vanish the moment it opened.
	let tagDialogOpen = $state(false);
	let editingTag = $state<Tag | null>(null);
	let deleteTarget = $state<Tag | null>(null);
	let backupOpen = $state(false);

	// Close the drawer, but only after the current event settles. A trigger inside the drawer
	// (a bits-ui dropdown item, a nav button) is still mid-teardown when its handler runs;
	// unmounting the drawer in that same flush makes bits-ui read destroyed deriveds
	// (Svelte's `derived_inert` warning). Deferring one tick lets it finish first.
	async function closeSidebar() {
		await tick();
		sidebarOpen = false;
	}

	function newTag() {
		editingTag = null;
		tagDialogOpen = true;
		closeSidebar();
	}
	function editTag(tag: Tag) {
		editingTag = tag;
		tagDialogOpen = true;
		closeSidebar();
	}
	function requestDelete(tag: Tag) {
		deleteTarget = tag;
		closeSidebar();
	}
	async function confirmDelete() {
		if (deleteTarget) await data.deleteTag(deleteTarget.id);
		deleteTarget = null;
	}
	function openBackup() {
		backupOpen = true;
		closeSidebar();
	}

	// First time in with a valid token but an empty cache → pull stars from GitHub.
	onMount(() => {
		if (auth.token && data.stars.length === 0 && !data.syncing) data.sync();
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') sidebarOpen = false;
	}}
/>

<div class="flex h-svh w-full overflow-hidden">
	<!-- Sidebar: a permanent column on large screens… -->
	<div class="hidden lg:flex">
		<Sidebar
			onNewTag={newTag}
			onEditTag={editTag}
			onRequestDelete={requestDelete}
			onOpenBackup={openBackup}
		/>
	</div>

	<!-- …and an off-canvas drawer on smaller ones. -->
	{#if sidebarOpen}
		<div class="fixed inset-0 z-50 lg:hidden">
			<button
				type="button"
				aria-label="Close menu"
				class="absolute inset-0 bg-black/50"
				onclick={() => (sidebarOpen = false)}
				transition:fade={{ duration: 150 }}
			></button>
			<div class="absolute inset-y-0 left-0 shadow-xl" transition:fly={{ x: -300, duration: 200 }}>
				<Sidebar
					onnavigate={closeSidebar}
					onNewTag={newTag}
					onEditTag={editTag}
					onRequestDelete={requestDelete}
					onOpenBackup={openBackup}
				/>
			</div>
		</div>
	{/if}

	<!-- Master list: full-width on phones, a fixed column from md up.
	     On phones it gives way to the detail pane once a repo is open. -->
	<div
		class="w-full min-w-0 md:w-[380px] md:shrink-0 md:border-r {data.selected
			? 'max-md:hidden'
			: ''}"
	>
		<StarList onmenu={() => (sidebarOpen = true)} />
	</div>

	<!-- Detail: the only pane shown on phones when a repo is selected; always visible from md up. -->
	<div class="min-w-0 flex-1 {data.selected ? '' : 'max-md:hidden'}">
		{#if data.selected}
			<StarDetail star={data.selected} onback={() => data.select(null)} />
		{:else}
			<div
				class="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
			>
				<Star class="size-10 opacity-30" />
				<p class="text-sm">Select a repository to view details and add notes.</p>
			</div>
		{/if}
	</div>
</div>

<!-- Dialogs live at the shell level so the drawer can close without unmounting them. -->
<TagDialog bind:open={tagDialogOpen} tag={editingTag} />
<BackupDialog bind:open={backupOpen} />

<AlertDialog.Root
	open={!!deleteTarget}
	onOpenChange={(o) => {
		if (!o) deleteTarget = null;
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete “{deleteTarget?.name}”?</AlertDialog.Title>
			<AlertDialog.Description>
				This removes the tag from every repository it's on. Your notes are unaffected. This can't be
				undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action class={buttonVariants({ variant: 'destructive' })} onclick={confirmDelete}>
				Delete tag
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
