<script lang="ts">
	import { data } from '$lib/stores/data.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import StarRow from './StarRow.svelte';
	import Search from '@lucide/svelte/icons/search';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Check from '@lucide/svelte/icons/check';
	import type { SortKey } from '$lib/types';

	const SORTS: { key: SortKey; label: string }[] = [
		{ key: 'starred-desc', label: 'Recently starred' },
		{ key: 'starred-asc', label: 'First starred' },
		{ key: 'stars-desc', label: 'Most stars' },
		{ key: 'pushed-desc', label: 'Recently updated' },
		{ key: 'name-asc', label: 'Name (A–Z)' }
	];
	let sortLabel = $derived(SORTS.find((s) => s.key === data.sort)?.label ?? 'Sort');
	let percent = $derived(
		data.progress && data.progress.total
			? Math.round((data.progress.loaded / data.progress.total) * 100)
			: 0
	);
</script>

<div class="flex h-full min-h-0 flex-col">
	<div class="space-y-2 border-b p-3">
		<div class="relative">
			<Search class="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
			<Input bind:value={data.search} placeholder="Search stars…" class="pl-8" />
		</div>
		<div class="flex items-center justify-between gap-2">
			<span class="text-muted-foreground text-xs">
				{data.filtered.length}
				{data.filtered.length === 1 ? 'repo' : 'repos'}
			</span>
			<div class="flex items-center gap-1">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class={buttonVariants({ variant: 'ghost', size: 'sm' })}>
						<ArrowUpDown /> {sortLabel}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						{#each SORTS as s (s.key)}
							<DropdownMenu.Item onSelect={() => (data.sort = s.key)}>
								<Check class={data.sort === s.key ? 'opacity-100' : 'opacity-0'} />
								{s.label}
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => data.sync()}
					disabled={data.syncing}
					title="Refresh stars from GitHub"
				>
					<RefreshCw class={data.syncing ? 'animate-spin' : ''} />
				</Button>
			</div>
		</div>
		{#if data.syncing}
			<div class="space-y-1">
				<div class="bg-muted h-1 w-full overflow-hidden rounded-full">
					<div class="bg-primary h-full transition-all duration-300" style="width: {percent}%"></div>
				</div>
				<p class="text-muted-foreground text-xs">
					Fetching stars… {data.progress?.loaded ?? 0}{data.progress?.total
						? ` / ${data.progress.total}`
						: ''}
				</p>
			</div>
		{/if}
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto">
		{#if data.filtered.length === 0}
			<div class="text-muted-foreground p-8 text-center text-sm">
				{#if data.stars.length === 0}
					No stars cached yet.
				{:else}
					No repositories match your filters.
				{/if}
			</div>
		{:else}
			{#each data.filtered as star (star.id)}
				<StarRow {star} selected={data.selectedId === star.id} onselect={() => data.select(star.id)} />
			{/each}
		{/if}
	</div>
</div>
