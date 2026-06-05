import { createGist, getGistContent, updateGist } from '$lib/github/client';
import type { BackupFile } from '$lib/types';
import { buildBackup, importBackup, parseBackup, serializeBackup, type ImportMode } from './export';

/**
 * Push the current backup to a private gist. Creates one if `gistId` is null,
 * otherwise updates the existing gist. Returns the gist id to persist.
 */
export async function pushToGist(token: string, gistId: string | null): Promise<string> {
	const json = serializeBackup(await buildBackup());
	if (gistId) {
		await updateGist(token, gistId, json);
		return gistId;
	}
	return createGist(token, json);
}

/** Pull a backup from a gist and apply it locally. */
export async function pullFromGist(
	token: string,
	gistId: string,
	mode: ImportMode = 'replace'
): Promise<BackupFile> {
	const content = await getGistContent(token, gistId);
	if (content === null) throw new Error('No Sidereum backup file was found in that gist.');
	const backup = parseBackup(content);
	await importBackup(backup, mode);
	return backup;
}
