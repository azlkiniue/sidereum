import type { Star } from '$lib/types';
import { languageColor } from './language-colors';

const REST_URL = 'https://api.github.com';

// NOTE: we use the GitHub REST API, not GraphQL. The GraphQL endpoint
// (api.github.com/graphql) does not send CORS headers, so it cannot be called
// from a browser. The REST API responds with `Access-Control-Allow-Origin: *`,
// which is what makes a purely client-side app like Sidereum possible.

/** Filename used for the backup stored in a GitHub Gist. */
export const GIST_FILENAME = 'sidereum-backup.json';

export interface Viewer {
	login: string;
	name: string | null;
	avatarUrl: string;
}

export class GitHubError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.name = 'GitHubError';
		this.status = status;
	}
}

async function ghFetch(
	token: string,
	path: string,
	init: RequestInit = {},
	accept = 'application/vnd.github+json'
): Promise<Response> {
	let res: Response;
	try {
		res = await fetch(REST_URL + path, {
			...init,
			headers: { Authorization: `Bearer ${token}`, Accept: accept, ...(init.headers ?? {}) }
		});
	} catch {
		throw new GitHubError('Network error reaching GitHub. Check your connection.', 0);
	}
	if (res.status === 401) throw new GitHubError('Invalid or expired token.', 401);
	if (res.status === 403) {
		if (res.headers.get('x-ratelimit-remaining') === '0') {
			throw new GitHubError('GitHub API rate limit exceeded — try again later.', 403);
		}
		throw new GitHubError('Forbidden — your token may lack the required scopes.', 403);
	}
	if (!res.ok) throw new GitHubError(`GitHub API error (HTTP ${res.status}).`, res.status);
	return res;
}

/** Validate a token and return the authenticated user. */
export async function getViewer(token: string): Promise<Viewer> {
	const res = await ghFetch(token, '/user');
	const u = (await res.json()) as { login: string; name: string | null; avatar_url: string };
	return { login: u.login, name: u.name, avatarUrl: u.avatar_url };
}

interface RestRepo {
	node_id: string;
	name: string;
	full_name: string;
	owner: { login: string; avatar_url: string };
	html_url: string;
	homepage: string | null;
	description: string | null;
	language: string | null;
	stargazers_count: number;
	forks_count: number;
	open_issues_count: number;
	pushed_at: string | null;
	created_at: string | null;
	archived: boolean;
	fork: boolean;
	private: boolean;
	topics?: string[];
	license: { spdx_id: string | null; name: string } | null;
}

/** Item shape when requesting `application/vnd.github.star+json` (adds `starred_at`). */
interface RestStarItem {
	starred_at: string;
	repo: RestRepo;
}

function mapStar(item: RestStarItem): Star {
	const r = item.repo;
	const spdx = r.license?.spdx_id;
	return {
		id: r.node_id,
		nameWithOwner: r.full_name,
		name: r.name,
		owner: r.owner.login,
		ownerAvatarUrl: r.owner.avatar_url,
		url: r.html_url,
		homepageUrl: r.homepage || null,
		description: r.description,
		primaryLanguage: r.language,
		languageColor: languageColor(r.language),
		stargazerCount: r.stargazers_count,
		forkCount: r.forks_count,
		openIssuesCount: r.open_issues_count,
		pushedAt: r.pushed_at,
		createdAt: r.created_at,
		starredAt: item.starred_at,
		isArchived: r.archived,
		isFork: r.fork,
		isPrivate: r.private,
		topics: r.topics ?? [],
		licenseName: spdx && spdx !== 'NOASSERTION' ? spdx : (r.license?.name ?? null)
	};
}

/** Extract a page number for a given `rel` from a REST `Link` header. */
function pageFromLink(link: string, rel: string): number | null {
	const match = link.match(new RegExp(`[?&]page=(\\d+)[^>]*>;\\s*rel="${rel}"`));
	return match ? Number(match[1]) : null;
}

/**
 * Fetch every starred repository for the authenticated user via the REST API,
 * paging 100 at a time. `onProgress` reports (loaded, total) for a progress bar;
 * `total` is estimated from the `Link: rel="last"` header until the final page.
 */
export async function fetchAllStars(
	token: string,
	onProgress?: (loaded: number, total: number) => void
): Promise<Star[]> {
	const stars: Star[] = [];
	const perPage = 100;
	let estimatedTotal = 0;

	// Hard cap (100k stars) so a malformed Link header can never loop forever.
	for (let page = 1; page <= 1000; page++) {
		const res = await ghFetch(
			token,
			`/user/starred?per_page=${perPage}&page=${page}`,
			{},
			'application/vnd.github.star+json'
		);
		const batch = (await res.json()) as RestStarItem[];
		for (const item of batch) stars.push(mapStar(item));

		const link = res.headers.get('Link') ?? '';
		if (page === 1) {
			const lastPage = pageFromLink(link, 'last');
			estimatedTotal = lastPage ? lastPage * perPage : stars.length;
		}
		onProgress?.(stars.length, Math.max(estimatedTotal, stars.length));

		if (!/rel="next"/.test(link) || batch.length === 0) break;
	}

	// Final, exact total.
	onProgress?.(stars.length, stars.length);
	return stars;
}

/* ------------------------------------------------------------------ */
/* Gist backup sync (REST)                                            */
/* ------------------------------------------------------------------ */

function jsonHeaders(token: string): HeadersInit {
	return {
		Authorization: `Bearer ${token}`,
		Accept: 'application/vnd.github+json',
		'Content-Type': 'application/json'
	};
}

export async function createGist(
	token: string,
	content: string,
	description = 'Sidereum backup — GitHub stars tags & notes'
): Promise<string> {
	const res = await fetch(`${REST_URL}/gists`, {
		method: 'POST',
		headers: jsonHeaders(token),
		body: JSON.stringify({ description, public: false, files: { [GIST_FILENAME]: { content } } })
	});
	if (res.status === 403 || res.status === 404)
		throw new GitHubError('Token lacks the "gist" scope required to create a gist.', res.status);
	if (!res.ok) throw new GitHubError(`Failed to create gist (HTTP ${res.status}).`, res.status);
	const json = (await res.json()) as { id: string };
	return json.id;
}

export async function updateGist(token: string, gistId: string, content: string): Promise<void> {
	const res = await fetch(`${REST_URL}/gists/${gistId}`, {
		method: 'PATCH',
		headers: jsonHeaders(token),
		body: JSON.stringify({ files: { [GIST_FILENAME]: { content } } })
	});
	if (!res.ok) throw new GitHubError(`Failed to update gist (HTTP ${res.status}).`, res.status);
}

export async function getGistContent(token: string, gistId: string): Promise<string | null> {
	const res = await fetch(`${REST_URL}/gists/${gistId}`, {
		headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
	});
	if (res.status === 404) return null;
	if (!res.ok) throw new GitHubError(`Failed to read gist (HTTP ${res.status}).`, res.status);
	const json = (await res.json()) as { files?: Record<string, { content?: string }> };
	return json.files?.[GIST_FILENAME]?.content ?? null;
}
