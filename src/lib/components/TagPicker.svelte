<script lang="ts">
	import { data } from '$lib/stores/data.svelte';
	import * as Popover from '$lib/components/ui/popover';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { TAG_COLORS, DEFAULT_TAG_COLOR } from '$lib/constants';
	import Plus from '@lucide/svelte/icons/plus';
	import Check from '@lucide/svelte/icons/check';
	import TagIcon from '@lucide/svelte/icons/tag';

	let { repoId }: { repoId: string } = $props();

	let open = $state(false);
	let query = $state('');

	let assigned = $derived(new Set(data.metaById[repoId]?.tagIds ?? []));
	let filtered = $derived(
		data.manualTags.filter((t) => t.name.toLowerCase().includes(query.toLowerCase().trim()))
	);
	let canCreate = $derived(
		query.trim().length > 0 &&
			!data.manualTags.some((t) => t.name.toLowerCase() === query.trim().toLowerCase())
	);

	async function createAndAssign() {
		const name = query.trim();
		if (!name) return;
		const color = TAG_COLORS[data.tags.length % TAG_COLORS.length] ?? DEFAULT_TAG_COLOR;
		const tag = await data.createTag({ name, color, smart: false });
		await data.toggleTag(repoId, tag.id);
		query = '';
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger class={buttonVariants({ variant: 'outline', size: 'sm' })}>
		<TagIcon /> Add tag
	</Popover.Trigger>
	<Popover.Content class="w-64 p-0" align="start">
		<div class="border-b p-2">
			<Input bind:value={query} placeholder="Filter or create…" class="h-8" />
		</div>
		<div class="max-h-64 overflow-y-auto p-1">
			{#each filtered as tag (tag.id)}
				<button
					type="button"
					class="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm"
					onclick={() => data.toggleTag(repoId, tag.id)}
				>
					<span class="size-3 shrink-0 rounded-full" style="background-color: {tag.color};"></span>
					<span class="flex-1 truncate text-left">{tag.name}</span>
					{#if assigned.has(tag.id)}<Check class="size-4 shrink-0" />{/if}
				</button>
			{/each}
			{#if filtered.length === 0 && !canCreate}
				<p class="text-muted-foreground px-2 py-3 text-center text-xs">No matching tags.</p>
			{/if}
		</div>
		{#if canCreate}
			<div class="border-t p-1">
				<button
					type="button"
					class="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm"
					onclick={createAndAssign}
				>
					<Plus class="size-4 shrink-0" />
					<span class="truncate">Create “{query.trim()}”</span>
				</button>
			</div>
		{/if}
	</Popover.Content>
</Popover.Root>
