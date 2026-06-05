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
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
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

	// --- pagination ---
	// `data.filtered` is already filtered + fully sorted across the entire dataset,
	// so slicing it here paginates without ever sorting only a single page.
	const PAGE_SIZE = 50;
	let page = $state(1);
	let scrollEl = $state<HTMLElement | null>(null);
	// Draft text for the "jump to page" field; committed on Enter/blur, not per keystroke.
	let pageDraft = $state('1');

	let pageCount = $derived(Math.max(1, Math.ceil(data.filtered.length / PAGE_SIZE)));
	let pageStart = $derived((page - 1) * PAGE_SIZE);
	let paged = $derived(data.filtered.slice(pageStart, pageStart + PAGE_SIZE));

	// Whenever the underlying set changes (search, sort, view, language, a re-sync),
	// jump back to the first page so the user isn't stranded on a now-empty page.
	$effect(() => {
		data.filtered; // track
		page = 1;
		scrollEl?.scrollTo({ top: 0 });
	});

	function goTo(next: number): void {
		page = Math.min(Math.max(1, next), pageCount);
		scrollEl?.scrollTo({ top: 0 });
	}

	// Mirror the live page into the input whenever it changes elsewhere (Prev/Next, filter reset).
	$effect(() => {
		pageDraft = String(page);
	});

	// Apply a typed page number. Anything non-numeric or out of range is rejected/clamped,
	// and the field always snaps back to the real current page.
	function commitPage(): void {
		const n = Number.parseInt(pageDraft, 10);
		if (Number.isFinite(n)) goTo(n);
		pageDraft = String(page);
	}
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

	<div class="min-h-0 flex-1 overflow-y-auto" bind:this={scrollEl}>
		{#if data.filtered.length === 0}
			<div class="text-muted-foreground p-8 text-center text-sm">
				{#if data.stars.length === 0}
					No stars cached yet.
				{:else}
					No repositories match your filters.
				{/if}
			</div>
		{:else}
			{#each paged as star (star.id)}
				<StarRow {star} selected={data.selectedId === star.id} onselect={() => data.select(star.id)} />
			{/each}
		{/if}
	</div>

	{#if pageCount > 1}
		<div class="flex items-center justify-between gap-2 border-t p-2">
			<Button variant="ghost" size="sm" onclick={() => goTo(page - 1)} disabled={page <= 1}>
				<ChevronLeft /> Prev
			</Button>
			<div class="text-muted-foreground flex items-center gap-1.5 text-xs">
				<span>Page</span>
				<Input
					type="number"
					min="1"
					max={pageCount}
					inputmode="numeric"
					aria-label="Go to page"
					bind:value={pageDraft}
					onfocus={(e) => e.currentTarget.select()}
					onkeydown={(e) => {
						if (e.key === 'Enter') e.currentTarget.blur();
					}}
					onblur={commitPage}
					class="h-7 w-14 px-1 text-center text-sm tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
				/>
				<span>of {pageCount}</span>
			</div>
			<Button variant="ghost" size="sm" onclick={() => goTo(page + 1)} disabled={page >= pageCount}>
				Next <ChevronRight />
			</Button>
		</div>
	{/if}
</div>
