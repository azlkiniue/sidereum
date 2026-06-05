import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { RepoMeta, Settings, Star, Tag } from '$lib/types';

interface SidereumDB extends DBSchema {
	stars: { key: string; value: Star };
	tags: { key: string; value: Tag };
	meta: { key: string; value: RepoMeta };
	settings: { key: string; value: Settings };
}

const DB_NAME = 'sidereum';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SidereumDB>> | null = null;

function db(): Promise<IDBPDatabase<SidereumDB>> {
	if (!dbPromise) {
		dbPromise = openDB<SidereumDB>(DB_NAME, DB_VERSION, {
			upgrade(database) {
				database.createObjectStore('stars', { keyPath: 'id' });
				database.createObjectStore('tags', { keyPath: 'id' });
				database.createObjectStore('meta', { keyPath: 'repoId' });
				database.createObjectStore('settings', { keyPath: 'id' });
			}
		});
	}
	return dbPromise;
}

/* ------------------------------- stars ------------------------------- */

export async function getAllStars(): Promise<Star[]> {
	return (await db()).getAll('stars');
}

/** Replace the entire stars cache in one transaction (used after a fresh sync). */
export async function replaceStars(stars: Star[]): Promise<void> {
	const database = await db();
	const tx = database.transaction('stars', 'readwrite');
	await tx.store.clear();
	for (const star of stars) tx.store.put(star);
	await tx.done;
}

/* -------------------------------- tags ------------------------------- */

export async function getAllTags(): Promise<Tag[]> {
	return (await db()).getAll('tags');
}

export async function putTag(tag: Tag): Promise<void> {
	await (await db()).put('tags', tag);
}

export async function deleteTagById(id: string): Promise<void> {
	await (await db()).delete('tags', id);
}

/* -------------------------------- meta ------------------------------- */

export async function getAllMeta(): Promise<RepoMeta[]> {
	return (await db()).getAll('meta');
}

export async function putMeta(meta: RepoMeta): Promise<void> {
	await (await db()).put('meta', meta);
}

export async function deleteMeta(repoId: string): Promise<void> {
	await (await db()).delete('meta', repoId);
}

/** Bulk-replace all metadata (used when importing / restoring a backup). */
export async function replaceMeta(metas: RepoMeta[]): Promise<void> {
	const database = await db();
	const tx = database.transaction('meta', 'readwrite');
	await tx.store.clear();
	for (const m of metas) tx.store.put(m);
	await tx.done;
}

/** Bulk-replace all tags. */
export async function replaceTags(tags: Tag[]): Promise<void> {
	const database = await db();
	const tx = database.transaction('tags', 'readwrite');
	await tx.store.clear();
	for (const t of tags) tx.store.put(t);
	await tx.done;
}

/* ------------------------------ settings ----------------------------- */

const DEFAULT_SETTINGS: Settings = {
	id: 'settings',
	gistId: null,
	autoSync: false,
	lastSyncedAt: null,
	lastFetchedAt: null
};

export async function getSettings(): Promise<Settings> {
	const existing = await (await db()).get('settings', 'settings');
	return existing ?? { ...DEFAULT_SETTINGS };
}

export async function putSettings(settings: Settings): Promise<void> {
	await (await db()).put('settings', settings);
}

/* ------------------------------ wipe all ----------------------------- */

/** Delete all locally-stored data (used by "Forget everything"). */
export async function clearAll(): Promise<void> {
	const database = await db();
	const tx = database.transaction(['stars', 'tags', 'meta', 'settings'], 'readwrite');
	await Promise.all([
		tx.objectStore('stars').clear(),
		tx.objectStore('tags').clear(),
		tx.objectStore('meta').clear(),
		tx.objectStore('settings').clear()
	]);
	await tx.done;
}
