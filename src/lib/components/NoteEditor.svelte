<script lang="ts">
	import { untrack } from 'svelte';
	import { data } from '$lib/stores/data.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Textarea } from '$lib/components/ui/textarea';
	import MarkdownNote from './MarkdownNote.svelte';
	import type { Star } from '$lib/types';

	// Keyed on star.id by the parent, so local draft state resets per repo.
	let { star }: { star: Star } = $props();

	// Seed once from the cache; the {#key} wrapper handles per-repo resets.
	let draft = $state(untrack(() => data.metaById[star.id]?.note ?? ''));
	let tab = $state('write');
	let timer: ReturnType<typeof setTimeout>;

	function scheduleSave() {
		clearTimeout(timer);
		const id = star.id;
		const value = draft;
		timer = setTimeout(() => data.setNote(id, value), 500);
	}

	// Flush any pending edit when navigating away / unmounting.
	$effect(() => {
		return () => {
			clearTimeout(timer);
			if (draft !== (data.metaById[star.id]?.note ?? '')) data.setNote(star.id, draft);
		};
	});
</script>

<Tabs.Root bind:value={tab} class="gap-2">
	<Tabs.List class="grid w-full max-w-[220px] grid-cols-2">
		<Tabs.Trigger value="write">Write</Tabs.Trigger>
		<Tabs.Trigger value="preview">Preview</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="write">
		<Textarea
			bind:value={draft}
			oninput={scheduleSave}
			placeholder="Add notes in Markdown…  **bold**, `code`, - lists, [links](https://…)"
			class="min-h-52 resize-y font-mono text-sm leading-relaxed"
		/>
	</Tabs.Content>
	<Tabs.Content value="preview">
		<div class="min-h-52 rounded-md border p-3">
			<MarkdownNote source={draft} />
		</div>
	</Tabs.Content>
</Tabs.Root>
