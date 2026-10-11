import { browser } from '$app/environment';
import { getViewer, isUnauthorized, type Viewer } from '$lib/github/client';

const TOKEN_KEY = 'sidereum:token';
/** The signed-in profile, cached so the account menu still has a name and avatar offline. */
const VIEWER_KEY = 'sidereum:viewer';

type AuthStatus = 'idle' | 'validating' | 'authenticated' | 'error';

class AuthStore {
	token = $state<string | null>(null);
	user = $state<Viewer | null>(null);
	status = $state<AuthStatus>('idle');
	error = $state<string | null>(null);

	isAuthenticated = $derived(this.status === 'authenticated' && !!this.token);

	/** Whether GitHub has accepted the current token during this session. */
	#verified = false;
	#verifying = false;

	/**
	 * Restore a saved session without waiting on the network, so the app opens straight from
	 * local data even offline. The app shell calls `revalidate()` once GitHub is reachable.
	 */
	init(): void {
		if (!browser) return;
		const saved = localStorage.getItem(TOKEN_KEY);
		if (!saved) return;
		this.token = saved;
		this.user = readSavedViewer();
		this.status = 'authenticated';
	}

	/**
	 * Confirm a restored token with GitHub and refresh the cached profile. Only GitHub
	 * rejecting the token (401) ends the session: being offline, or GitHub failing in some
	 * other way, keeps the user in, and the check runs again on the next reconnect.
	 */
	async revalidate(): Promise<void> {
		const token = this.token;
		if (!token || this.#verified || this.#verifying) return;
		this.#verifying = true;
		try {
			const user = await getViewer(token);
			if (token !== this.token) return; // signed out meanwhile
			this.#setUser(user);
			this.#verified = true;
		} catch (e) {
			if (isUnauthorized(e)) this.expire(token);
		} finally {
			this.#verifying = false;
		}
	}

	/** Validate and persist a token entered by the user. GitHub must accept it. */
	async login(input: string): Promise<boolean> {
		const token = input.trim();
		this.status = 'validating';
		this.error = null;
		try {
			const user = await getViewer(token);
			this.token = token;
			this.#setUser(user);
			this.#verified = true;
			this.status = 'authenticated';
			if (browser) localStorage.setItem(TOKEN_KEY, token);
			return true;
		} catch (e) {
			this.status = 'error';
			this.error = e instanceof Error ? e.message : 'Could not validate token.';
			return false;
		}
	}

	/** GitHub rejected `token`: end the session (if it's still the current one) and say why. */
	expire(token: string): void {
		if (token !== this.token) return;
		this.#clear();
		this.status = 'error';
		this.error =
			'GitHub rejected your saved token. It may have been revoked or expired. Enter a new one to continue.';
	}

	logout(): void {
		this.#clear();
		this.status = 'idle';
		this.error = null;
	}

	#clear(): void {
		this.token = null;
		this.user = null;
		this.#verified = false;
		if (browser) {
			localStorage.removeItem(TOKEN_KEY);
			localStorage.removeItem(VIEWER_KEY);
		}
	}

	#setUser(user: Viewer): void {
		this.user = user;
		if (browser) localStorage.setItem(VIEWER_KEY, JSON.stringify(user));
	}
}

function readSavedViewer(): Viewer | null {
	try {
		const saved = localStorage.getItem(VIEWER_KEY);
		return saved ? (JSON.parse(saved) as Viewer) : null;
	} catch {
		return null;
	}
}

export const auth = new AuthStore();
