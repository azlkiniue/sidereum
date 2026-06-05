import type { RepoMeta, SmartField, SmartOperator, SmartRule, SmartRuleGroup, Star } from '$lib/types';

export const SMART_FIELDS: { value: SmartField; label: string; boolean?: boolean }[] = [
	{ value: 'language', label: 'Language' },
	{ value: 'name', label: 'Repo name' },
	{ value: 'owner', label: 'Owner' },
	{ value: 'fullName', label: 'Full name (owner/repo)' },
	{ value: 'description', label: 'Description' },
	{ value: 'topic', label: 'Topic' },
	{ value: 'note', label: 'Note' },
	{ value: 'isArchived', label: 'Archived', boolean: true },
	{ value: 'isFork', label: 'Fork', boolean: true }
];

export const STRING_OPERATORS: { value: SmartOperator; label: string }[] = [
	{ value: 'contains', label: 'contains' },
	{ value: 'notContains', label: 'does not contain' },
	{ value: 'equals', label: 'equals' },
	{ value: 'startsWith', label: 'starts with' },
	{ value: 'endsWith', label: 'ends with' }
];

export const BOOL_OPERATORS: { value: SmartOperator; label: string }[] = [
	{ value: 'isTrue', label: 'is true' },
	{ value: 'isFalse', label: 'is false' }
];

export function isBooleanField(field: SmartField): boolean {
	return field === 'isArchived' || field === 'isFork';
}

export function operatorsFor(field: SmartField) {
	return isBooleanField(field) ? BOOL_OPERATORS : STRING_OPERATORS;
}

function stringField(star: Star, meta: RepoMeta | undefined, field: SmartField): string {
	switch (field) {
		case 'language':
			return star.primaryLanguage ?? '';
		case 'name':
			return star.name;
		case 'owner':
			return star.owner;
		case 'fullName':
			return star.nameWithOwner;
		case 'description':
			return star.description ?? '';
		case 'note':
			return meta?.note ?? '';
		default:
			return '';
	}
}

export function evaluateRule(star: Star, meta: RepoMeta | undefined, rule: SmartRule): boolean {
	if (isBooleanField(rule.field)) {
		const value = rule.field === 'isArchived' ? star.isArchived : star.isFork;
		if (rule.operator === 'isTrue') return value === true;
		if (rule.operator === 'isFalse') return value === false;
		return false;
	}

	const needle = rule.value.toLowerCase().trim();
	if (needle === '') return rule.operator === 'notContains';

	// `topic` matches against the set of topics (any-match semantics).
	if (rule.field === 'topic') {
		const topics = star.topics.map((t) => t.toLowerCase());
		switch (rule.operator) {
			case 'contains':
				return topics.some((t) => t.includes(needle));
			case 'notContains':
				return !topics.some((t) => t.includes(needle));
			case 'equals':
				return topics.includes(needle);
			case 'startsWith':
				return topics.some((t) => t.startsWith(needle));
			case 'endsWith':
				return topics.some((t) => t.endsWith(needle));
			default:
				return false;
		}
	}

	const hay = stringField(star, meta, rule.field).toLowerCase();
	switch (rule.operator) {
		case 'contains':
			return hay.includes(needle);
		case 'notContains':
			return !hay.includes(needle);
		case 'equals':
			return hay === needle;
		case 'startsWith':
			return hay.startsWith(needle);
		case 'endsWith':
			return hay.endsWith(needle);
		default:
			return false;
	}
}

export function matchesSmartTag(
	star: Star,
	meta: RepoMeta | undefined,
	group: SmartRuleGroup | undefined
): boolean {
	if (!group || group.rules.length === 0) return false;
	return group.combinator === 'and'
		? group.rules.every((r) => evaluateRule(star, meta, r))
		: group.rules.some((r) => evaluateRule(star, meta, r));
}

export function emptyRule(): SmartRule {
	return { field: 'language', operator: 'contains', value: '' };
}

export function emptyRuleGroup(): SmartRuleGroup {
	return { combinator: 'and', rules: [emptyRule()] };
}
