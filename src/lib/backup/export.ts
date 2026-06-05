import { getAllMeta, getAllTags, putMeta, putTag, replaceMeta, replaceTags } from '$lib/db';
import type { BackupFile, RepoMeta, Tag } from '$lib/types';

export const BACKUP_VERSION = 1;

export async function buildBackup(): Promise<BackupFile> {
	const [tags, meta] = await Promise.all([getAllTags(), getAllMeta()]);
	return {
		app: 'sidereum',
		version: BACKUP_VERSION,
		exportedAt: new Date().toISOString(),
		tags,
		meta
	};
}

export function serializeBackup(backup: BackupFile): string {
	return JSON.stringify(backup, null, 2);
}

/** Trigger a browser download of the current tags + notes as a JSON file. */
export async function downloadBackup(): Promise<void> {
	const json = serializeBackup(await buildBackup());
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `sidereum-backup-${new Date().toISOString().slice(0, 10)}.json`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

export function parseBackup(text: string): BackupFile {
	let data: unknown;
	try {
		data = JSON.parse(text);
	} catch {
		throw new Error('File is not valid JSON.');
	}
	if (!data || typeof data !== 'object') throw new Error('Unexpected backup format.');
	const b = data as Partial<BackupFile>;
	if (b.app !== 'sidereum') throw new Error('This does not look like a Sidereum backup.');
	if (!Array.isArray(b.tags) || !Array.isArray(b.meta)) {
		throw new Error('Backup is missing its tags or notes.');
	}
	return {
		app: 'sidereum',
		version: b.version ?? 1,
		exportedAt: b.exportedAt ?? '',
		tags: b.tags as Tag[],
		meta: b.meta as RepoMeta[]
	};
}

export type ImportMode = 'merge' | 'replace';

/**
 * Apply a parsed backup to the local database.
 * - `replace` wipes existing tags/notes and uses the backup verbatim.
 * - `merge` unions tags by id, unions tag assignments per repo, and keeps the most
 *   recently edited note when both sides have one.
 */
export async function importBackup(
	backup: BackupFile,
	mode: ImportMode
): Promise<{ tags: number; meta: number }> {
	if (mode === 'replace') {
		await replaceTags(backup.tags);
		await replaceMeta(backup.meta);
		return { tags: backup.tags.length, meta: backup.meta.length };
	}

	const [existingTags, existingMeta] = await Promise.all([getAllTags(), getAllMeta()]);

	const tagById = new Map(existingTags.map((t) => [t.id, t]));
	for (const t of backup.tags) tagById.set(t.id, t);
	for (const t of tagById.values()) await putTag(t);

	const metaById = new Map(existingMeta.map((m) => [m.repoId, m]));
	for (const incoming of backup.meta) {
		const current = metaById.get(incoming.repoId);
		if (!current) {
			metaById.set(incoming.repoId, incoming);
			continue;
		}
		metaById.set(incoming.repoId, {
			repoId: incoming.repoId,
			tagIds: Array.from(new Set([...current.tagIds, ...incoming.tagIds])),
			note: incoming.updatedAt >= current.updatedAt ? incoming.note : current.note,
			updatedAt: Math.max(incoming.updatedAt, current.updatedAt)
		});
	}
	for (const m of metaById.values()) await putMeta(m);

	return { tags: backup.tags.length, meta: backup.meta.length };
}
