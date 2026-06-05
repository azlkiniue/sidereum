<script lang="ts">
	import type { SmartField, SmartOperator, SmartRule, SmartRuleGroup } from '$lib/types';
	import { SMART_FIELDS, operatorsFor, isBooleanField, emptyRule } from '$lib/smart/rules';
	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	let { group = $bindable() }: { group: SmartRuleGroup } = $props();

	const fieldLabel = (f: SmartField) => SMART_FIELDS.find((x) => x.value === f)?.label ?? 'Field';
	const opLabel = (f: SmartField, op: SmartOperator) =>
		operatorsFor(f).find((x) => x.value === op)?.label ?? 'is';

	function setField(rule: SmartRule, value: SmartField) {
		rule.field = value;
		const ops = operatorsFor(value);
		if (!ops.some((o) => o.value === rule.operator)) rule.operator = ops[0].value;
		if (isBooleanField(value)) rule.value = '';
	}

	const addRule = () => (group.rules = [...group.rules, emptyRule()]);
	const removeRule = (rule: SmartRule) => (group.rules = group.rules.filter((r) => r !== rule));
</script>

<div class="space-y-2">
	<div class="flex flex-wrap items-center gap-2 text-sm">
		<span class="text-muted-foreground">Match</span>
		<Select.Root
			type="single"
			value={group.combinator}
			onValueChange={(v) => (group.combinator = v as 'and' | 'or')}
		>
			<Select.Trigger size="sm" class="w-auto">{group.combinator === 'and' ? 'all' : 'any'}</Select.Trigger>
			<Select.Content>
				<Select.Item value="and" label="all">all</Select.Item>
				<Select.Item value="or" label="any">any</Select.Item>
			</Select.Content>
		</Select.Root>
		<span class="text-muted-foreground">of these rules:</span>
	</div>

	{#each group.rules as rule (rule)}
		<div class="flex items-center gap-1.5">
			<Select.Root
				type="single"
				value={rule.field}
				onValueChange={(v) => setField(rule, v as SmartField)}
			>
				<Select.Trigger size="sm" class="w-32 shrink-0">{fieldLabel(rule.field)}</Select.Trigger>
				<Select.Content>
					{#each SMART_FIELDS as f (f.value)}
						<Select.Item value={f.value} label={f.label}>{f.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>

			<Select.Root
				type="single"
				value={rule.operator}
				onValueChange={(v) => (rule.operator = v as SmartOperator)}
			>
				<Select.Trigger size="sm" class="w-auto shrink-0">{opLabel(rule.field, rule.operator)}</Select.Trigger>
				<Select.Content>
					{#each operatorsFor(rule.field) as o (o.value)}
						<Select.Item value={o.value} label={o.label}>{o.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>

			{#if isBooleanField(rule.field)}
				<div class="flex-1"></div>
			{:else}
				<Input bind:value={rule.value} placeholder="value" class="h-7 flex-1" />
			{/if}

			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				onclick={() => removeRule(rule)}
				disabled={group.rules.length === 1}
				aria-label="Remove rule"
			>
				<Trash2 />
			</Button>
		</div>
	{/each}

	<Button type="button" variant="outline" size="sm" onclick={addRule}>
		<Plus /> Add rule
	</Button>
</div>
