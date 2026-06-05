<script lang="ts">
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';

	let { source }: { source: string } = $props();

	const html = $derived.by(() => {
		const trimmed = source.trim();
		if (!trimmed) return '';
		const raw = marked.parse(trimmed, { async: false, gfm: true, breaks: true }) as string;
		return DOMPurify.sanitize(raw, { ADD_ATTR: ['target', 'rel'] });
	});
</script>

{#if html}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<div class="note-content">{@html html}</div>
{:else}
	<p class="text-muted-foreground text-sm italic">
		Nothing here yet. Switch to <span class="font-medium">Write</span> to add notes in Markdown.
	</p>
{/if}
