/** A starred repository, as cached locally from the GitHub API. */
export interface Star {
	/** GitHub GraphQL node id — stable across renames, used as the primary key. */
	id: string;
	nameWithOwner: string;
	name: string;
	owner: string;
	ownerAvatarUrl: string;
	url: string;
	homepageUrl: string | null;
	description: string | null;
	primaryLanguage: string | null;
	languageColor: string | null;
	stargazerCount: number;
	forkCount: number;
	openIssuesCount: number;
	pushedAt: string | null;
	createdAt: string | null;
	/** When the viewer starred the repo (ISO 8601). */
	starredAt: string;
	isArchived: boolean;
	isFork: boolean;
	isPrivate: boolean;
	topics: string[];
	licenseName: string | null;
}

/** A user-defined tag. May be "smart" (membership computed from rules). */
export interface Tag {
	id: string;
	name: string;
	color: string; // hex, e.g. "#22c55e"
	createdAt: number;
	smart: boolean;
	rules?: SmartRuleGroup;
}

/** Per-repository metadata that lives only in the browser (never sent to GitHub, unless gist-synced). */
export interface RepoMeta {
	repoId: string;
	tagIds: string[];
	note: string;
	updatedAt: number;
}

export type SmartField =
	| 'language'
	| 'name'
	| 'owner'
	| 'fullName'
	| 'description'
	| 'topic'
	| 'note'
	| 'isArchived'
	| 'isFork';

export type SmartOperator =
	| 'contains'
	| 'notContains'
	| 'equals'
	| 'startsWith'
	| 'endsWith'
	| 'isTrue'
	| 'isFalse';

export interface SmartRule {
	field: SmartField;
	operator: SmartOperator;
	value: string;
}

export interface SmartRuleGroup {
	combinator: 'and' | 'or';
	rules: SmartRule[];
}

/** Shape of the exported / gist-synced backup document. */
export interface BackupFile {
	app: 'sidereum';
	version: number;
	exportedAt: string;
	tags: Tag[];
	meta: RepoMeta[];
}

export interface Settings {
	id: 'settings';
	gistId: string | null;
	autoSync: boolean;
	lastSyncedAt: number | null;
	lastFetchedAt: number | null;
}

export type SortKey = 'starred-desc' | 'starred-asc' | 'stars-desc' | 'pushed-desc' | 'name-asc';

export type ViewKind =
	| { kind: 'all' }
	| { kind: 'untagged' }
	| { kind: 'tag'; tagId: string }
	| { kind: 'smart'; tagId: string };
