import Fuse, { type IFuseOptions } from 'fuse.js';
import {
	clearAll,
	getAllMeta,
	getAllStars,
	getAllTags,
	getSettings,
	putMeta,
	putSettings,
	putTag,
	deleteTagById,
	replaceStars
} from '$lib/db';
import { fetchAllStars } from '$lib/github/client';
import { pushToGist } from '$lib/backup/gist';
import { matchesSmartTag } from '$lib/smart/rules';
import type { RepoMeta, Settings, SmartRuleGroup, SortKey, Star, Tag, ViewKind } from '$lib/types';
import { auth } from './auth.svelte';

export interface LanguageStat {
	name: string;
	color: string | null;
	count: number;
}

const FUSE_OPTIONS: IFuseOptions<Star> = {
	keys: [
		{ name: 'nameWithOwner', weight: 2 },
		{ name: 'name', weight: 2 },
		{ name: 'owner', weight: 1 },
		{ name: 'description', weight: 1 },
		{ name: 'topics', weight: 1 },
		{ name: 'primaryLanguage', weight: 0.5 }
	],
	threshold: 0.35,
	ignoreLocation: true,
	includeScore: false
};

class DataStore {
	stars = $state<Star[]>([]);
	tags = $state<Tag[]>([]);
	metaById = $state<Record<string, RepoMeta>>({});
	settings = $state<Settings>({
		id: 'settings',
		gistId: null,
		autoSync: false,
		lastSyncedAt: null,
		lastFetchedAt: null
	});

	loading = $state(true);
	syncing = $state(false);
	progress = $state<{ loaded: number; total: number } | null>(null);

	// --- filter / selection state ---
	search = $state('');
	languageFilter = $state<string | null>(null);
	view = $state<ViewKind>({ kind: 'all' });
	sort = $state<SortKey>('starred-desc');
	selectedId = $state<string | null>(null);

	// --- derived lookups ---
	tagById = $derived(new Map(this.tags.map((t) => [t.id, t])));
	manualTags = $derived(this.tags.filter((t) => !t.smart).sort((a, b) => a.name.localeCompare(b.name)));
	smartTags = $derived(this.tags.filter((t) => t.smart).sort((a, b) => a.name.localeCompare(b.name)));

	languages = $derived.by<LanguageStat[]>(() => {
		const map = new Map<string, LanguageStat>();
		for (const s of this.stars) {
			if (!s.primaryLanguage) continue;
			const entry = map.get(s.primaryLanguage);
			if (entry) entry.count++;
			else map.set(s.primaryLanguage, { name: s.primaryLanguage, color: s.languageColor, count: 1 });
		}
		return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
	});

	untaggedCount = $derived(
		this.stars.reduce((acc, s) => {
			const m = this.metaById[s.id];
			return acc + (!m || m.tagIds.length === 0 ? 1 : 0);
		}, 0)
	);

	#fuse = $derived(new Fuse(this.stars, FUSE_OPTIONS));

	filtered = $derived.by<Star[]>(() => {
		const base = this.stars.filter((s) => this.#matchesView(s) && this.#matchesLanguage(s));
		const q = this.search.trim();
		if (q) {
			const allowed = new Set(base.map((s) => s.id));
			return this.#fuse
				.search(q)
				.map((r) => r.item)
				.filter((s) => allowed.has(s.id));
		}
		const arr = [...base];
		this.#sort(arr);
		return arr;
	});

	selected = $derived(
		this.selectedId ? this.stars.find((s) => s.id === this.selectedId) : undefined
	);
	selectedMeta = $derived(this.selectedId ? this.metaById[this.selectedId] : undefined);

	// --- view / language predicates ---
	#matchesLanguage(star: Star): boolean {
		return !this.languageFilter || star.primaryLanguage === this.languageFilter;
	}

	#matchesView(star: Star): boolean {
		const v = this.view;
		switch (v.kind) {
			case 'all':
				return true;
			case 'untagged': {
				const m = this.metaById[star.id];
				return !m || m.tagIds.length === 0;
			}
			case 'tag': {
				const m = this.metaById[star.id];
				return !!m && m.tagIds.includes(v.tagId);
			}
			case 'smart': {
				const tag = this.tagById.get(v.tagId);
				return !!tag && matchesSmartTag(star, this.metaById[star.id], tag.rules);
			}
		}
	}

	#sort(arr: Star[]): void {
		switch (this.sort) {
			case 'starred-desc':
				arr.sort((a, b) => b.starredAt.localeCompare(a.starredAt));
				break;
			case 'starred-asc':
				arr.sort((a, b) => a.starredAt.localeCompare(b.starredAt));
				break;
			case 'stars-desc':
				arr.sort((a, b) => b.stargazerCount - a.stargazerCount);
				break;
			case 'pushed-desc':
				arr.sort((a, b) => (b.pushedAt ?? '').localeCompare(a.pushedAt ?? ''));
				break;
			case 'name-asc':
				arr.sort((a, b) => a.nameWithOwner.localeCompare(b.nameWithOwner));
				break;
		}
	}

	// --- per-repo helpers used by the UI ---
	tagsForRepo(id: string): Tag[] {
		const m = this.metaById[id];
		if (!m) return [];
		return m.tagIds
			.map((tid) => this.tagById.get(tid))
			.filter((t): t is Tag => !!t);
	}

	smartTagsForRepo(star: Star): Tag[] {
		return this.smartTags.filter((t) => matchesSmartTag(star, this.metaById[star.id], t.rules));
	}

	tagCount(id: string): number {
		return this.stars.reduce(
			(acc, s) => acc + (this.metaById[s.id]?.tagIds.includes(id) ? 1 : 0),
			0
		);
	}

	smartCount(tag: Tag): number {
		return this.stars.reduce(
			(acc, s) => acc + (matchesSmartTag(s, this.metaById[s.id], tag.rules) ? 1 : 0),
			0
		);
	}

	// --- lifecycle ---
	async init(): Promise<void> {
		this.loading = true;
		const [stars, tags, meta, settings] = await Promise.all([
			getAllStars(),
			getAllTags(),
			getAllMeta(),
			getSettings()
		]);
		this.stars = stars;
		this.tags = tags;
		this.metaById = Object.fromEntries(meta.map((m) => [m.repoId, m]));
		this.settings = settings;
		this.loading = false;
	}

	/** Fetch the full star list from GitHub and replace the local cache. */
	async sync(): Promise<void> {
		const token = auth.token;
		if (!token || this.syncing) return;
		this.syncing = true;
		this.progress = { loaded: 0, total: 0 };
		try {
			const stars = await fetchAllStars(token, (loaded, total) => {
				this.progress = { loaded, total };
			});
			this.stars = stars;
			await replaceStars(stars);
			await this.#patchSettings({ lastFetchedAt: Date.now() });
		} finally {
			this.syncing = false;
			this.progress = null;
		}
	}

	select(id: string | null): void {
		this.selectedId = id;
	}

	setView(view: ViewKind): void {
		this.view = view;
	}

	// --- metadata mutations ---
	#metaOrNew(repoId: string): RepoMeta {
		return this.metaById[repoId] ?? { repoId, tagIds: [], note: '', updatedAt: Date.now() };
	}

	async toggleTag(repoId: string, tagId: string): Promise<void> {
		const current = this.#metaOrNew(repoId);
		const has = current.tagIds.includes(tagId);
		const next: RepoMeta = {
			...current,
			tagIds: has ? current.tagIds.filter((t) => t !== tagId) : [...current.tagIds, tagId],
			updatedAt: Date.now()
		};
		this.metaById = { ...this.metaById, [repoId]: next };
		await putMeta(next);
		this.#scheduleAutoSync();
	}

	async setNote(repoId: string, note: string): Promise<void> {
		const current = this.#metaOrNew(repoId);
		const next: RepoMeta = { ...current, note, updatedAt: Date.now() };
		this.metaById = { ...this.metaById, [repoId]: next };
		await putMeta(next);
		this.#scheduleAutoSync();
	}

	// --- tag mutations ---
	async createTag(input: {
		name: string;
		color: string;
		smart: boolean;
		rules?: SmartRuleGroup;
	}): Promise<Tag> {
		const tag: Tag = {
			id: crypto.randomUUID(),
			name: input.name.trim(),
			color: input.color,
			createdAt: Date.now(),
			smart: input.smart,
			rules: input.smart ? input.rules : undefined
		};
		this.tags = [...this.tags, tag];
		await putTag(tag);
		this.#scheduleAutoSync();
		return tag;
	}

	async updateTag(id: string, patch: Partial<Omit<Tag, 'id'>>): Promise<void> {
		const idx = this.tags.findIndex((t) => t.id === id);
		if (idx < 0) return;
		const next: Tag = { ...this.tags[idx], ...patch };
		this.tags = [...this.tags.slice(0, idx), next, ...this.tags.slice(idx + 1)];
		await putTag(next);
		this.#scheduleAutoSync();
	}

	async deleteTag(id: string): Promise<void> {
		this.tags = this.tags.filter((t) => t.id !== id);
		await deleteTagById(id);

		const nextMeta = { ...this.metaById };
		const touched: RepoMeta[] = [];
		for (const m of Object.values(this.metaById)) {
			if (m.tagIds.includes(id)) {
				const nm: RepoMeta = {
					...m,
					tagIds: m.tagIds.filter((t) => t !== id),
					updatedAt: Date.now()
				};
				nextMeta[m.repoId] = nm;
				touched.push(nm);
			}
		}
		this.metaById = nextMeta;
		for (const nm of touched) await putMeta(nm);

		if (
			(this.view.kind === 'tag' || this.view.kind === 'smart') &&
			this.view.tagId === id
		) {
			this.view = { kind: 'all' };
		}
		this.#scheduleAutoSync();
	}

	// --- settings / gist ---
	async #patchSettings(patch: Partial<Settings>): Promise<void> {
		this.settings = { ...this.settings, ...patch };
		await putSettings(this.settings);
	}

	setGistId(id: string | null): Promise<void> {
		return this.#patchSettings({ gistId: id });
	}

	setAutoSync(on: boolean): Promise<void> {
		return this.#patchSettings({ autoSync: on });
	}

	markSynced(): Promise<void> {
		return this.#patchSettings({ lastSyncedAt: Date.now() });
	}

	#syncTimer: ReturnType<typeof setTimeout> | null = null;
	/** Debounced push to gist after local edits, when auto-sync is enabled. */
	#scheduleAutoSync(): void {
		if (!this.settings.autoSync || !this.settings.gistId || !auth.token) return;
		if (this.#syncTimer) clearTimeout(this.#syncTimer);
		this.#syncTimer = setTimeout(() => {
			void this.#runAutoSync();
		}, 2500);
	}

	async #runAutoSync(): Promise<void> {
		const token = auth.token;
		if (!token || !this.settings.gistId) return;
		try {
			await pushToGist(token, this.settings.gistId);
			await this.markSynced();
		} catch {
			// Silent: a failed background sync shouldn't interrupt the user.
		}
	}

	/** Wipe every locally-stored byte (stars cache, tags, notes, settings). */
	async forgetEverything(): Promise<void> {
		await clearAll();
		this.stars = [];
		this.tags = [];
		this.metaById = {};
		this.settings = {
			id: 'settings',
			gistId: null,
			autoSync: false,
			lastSyncedAt: null,
			lastFetchedAt: null
		};
		this.view = { kind: 'all' };
		this.selectedId = null;
		this.search = '';
		this.languageFilter = null;
	}
}

export const data = new DataStore();
