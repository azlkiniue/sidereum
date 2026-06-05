<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import RuleBuilder from './RuleBuilder.svelte';
	import { data } from '$lib/stores/data.svelte';
	import { TAG_COLORS, DEFAULT_TAG_COLOR } from '$lib/constants';
	import { emptyRuleGroup } from '$lib/smart/rules';
	import type { SmartRuleGroup, Tag } from '$lib/types';

	let { open = $bindable(), tag = null }: { open: boolean; tag?: Tag | null } = $props();

	let name = $state('');
	let color = $state(DEFAULT_TAG_COLOR);
	let smart = $state(false);
	let rules = $state<SmartRuleGroup>(emptyRuleGroup());

	// Re-seed the form whenever the dialog opens (for the current tag, or a blank one).
	$effect(() => {
		if (!open) return;
		name = tag?.name ?? '';
		color = tag?.color ?? DEFAULT_TAG_COLOR;
		smart = tag?.smart ?? false;
		rules = tag?.rules ? structuredClone($state.snapshot(tag.rules)) : emptyRuleGroup();
	});

	let valid = $derived(name.trim().length > 0 && (!smart || rules.rules.length > 0));

	async function save() {
		if (!valid) return;
		const payload = { name: name.trim(), color, smart, rules: smart ? rules : undefined };
		if (tag) await data.updateTag(tag.id, payload);
		else await data.createTag(payload);
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>{tag ? 'Edit tag' : 'New tag'}</Dialog.Title>
		</Dialog.Header>

		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="tag-name">Name</Label>
				<Input id="tag-name" bind:value={name} placeholder="e.g. To read" />
			</div>

			<div class="space-y-2">
				<Label>Color</Label>
				<div class="flex flex-wrap gap-1.5">
					{#each TAG_COLORS as c (c)}
						<button
							type="button"
							class="ring-offset-background size-6 rounded-full transition {color === c
								? 'ring-ring ring-2 ring-offset-2'
								: ''}"
							style="background-color: {c};"
							aria-label="Choose color {c}"
							onclick={() => (color = c)}
						></button>
					{/each}
				</div>
			</div>

			<label class="flex items-center gap-2 text-sm">
				<Checkbox bind:checked={smart} />
				Smart tag — auto-assign repositories that match rules
			</label>

			{#if smart}
				<div class="bg-muted/30 rounded-md border p-3">
					<RuleBuilder bind:group={rules} />
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="ghost" onclick={() => (open = false)}>Cancel</Button>
			<Button onclick={save} disabled={!valid}>{tag ? 'Save' : 'Create'}</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
