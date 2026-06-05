<script lang="ts">
	import type { Tag } from '$lib/types';
	import { readableText } from '$lib/utils/format';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import X from '@lucide/svelte/icons/x';

	let {
		tag,
		removable = false,
		onremove
	}: { tag: Tag; removable?: boolean; onremove?: () => void } = $props();
</script>

<span
	class="inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
	style="background-color: {tag.color}; color: {readableText(tag.color)};"
>
	{#if tag.smart}
		<Sparkles class="size-3 shrink-0 opacity-80" />
	{/if}
	<span class="truncate">{tag.name}</span>
	{#if removable}
		<button
			type="button"
			class="-mr-0.5 ml-0.5 shrink-0 rounded-full opacity-70 transition hover:opacity-100"
			aria-label="Remove {tag.name}"
			onclick={(e) => {
				e.stopPropagation();
				onremove?.();
			}}
		>
			<X class="size-3" />
		</button>
	{/if}
</span>
