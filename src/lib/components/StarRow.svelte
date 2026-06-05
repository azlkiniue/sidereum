<script lang="ts">
	import type { Star } from '$lib/types';
	import { data } from '$lib/stores/data.svelte';
	import TagBadge from './TagBadge.svelte';
	import { compactNumber, timeAgo } from '$lib/utils/format';
	import StarIcon from '@lucide/svelte/icons/star';
	import Archive from '@lucide/svelte/icons/archive';
	import StickyNote from '@lucide/svelte/icons/sticky-note';

	let { star, selected, onselect }: { star: Star; selected: boolean; onselect: () => void } =
		$props();

	let tags = $derived(data.tagsForRepo(star.id));
	let hasNote = $derived(!!data.metaById[star.id]?.note?.trim());
</script>

<button
	type="button"
	onclick={onselect}
	class="w-full border-b px-4 py-3 text-left transition-colors {selected
		? 'bg-muted'
		: 'hover:bg-muted/50'}"
>
	<div class="flex items-start justify-between gap-2">
		<h3 class="truncate text-sm font-semibold">
			<span class="text-muted-foreground font-normal">{star.owner}/</span>{star.name}
		</h3>
		<span class="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
			<StarIcon class="size-3" />{compactNumber(star.stargazerCount)}
		</span>
	</div>

	{#if star.description}
		<p class="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">
			{star.description}
		</p>
	{/if}

	<div class="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
		{#if star.primaryLanguage}
			<span class="flex items-center gap-1">
				<span
					class="size-2.5 rounded-full"
					style="background-color: {star.languageColor ?? '#888'};"
				></span>
				{star.primaryLanguage}
			</span>
		{/if}
		{#if star.pushedAt}
			<span>Updated {timeAgo(star.pushedAt)}</span>
		{/if}
		{#if star.isArchived}
			<span class="flex items-center gap-1 text-amber-600 dark:text-amber-500">
				<Archive class="size-3" /> Archived
			</span>
		{/if}
		{#if hasNote}
			<StickyNote class="size-3" />
		{/if}
	</div>

	{#if tags.length}
		<div class="mt-2 flex flex-wrap gap-1">
			{#each tags as tag (tag.id)}
				<TagBadge {tag} />
			{/each}
		</div>
	{/if}
</button>
