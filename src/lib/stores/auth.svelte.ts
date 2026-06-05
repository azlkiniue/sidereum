import { browser } from '$app/environment';
import { getViewer, type Viewer } from '$lib/github/client';

const TOKEN_KEY = 'sidereum:token';

type AuthStatus = 'idle' | 'validating' | 'authenticated' | 'error';

class AuthStore {
	token = $state<string | null>(null);
	user = $state<Viewer | null>(null);
	status = $state<AuthStatus>('idle');
	error = $state<string | null>(null);

	isAuthenticated = $derived(this.status === 'authenticated' && !!this.token);

	/** Restore a saved token (if any) and revalidate it on startup. */
	async init(): Promise<boolean> {
		if (!browser) return false;
		const saved = localStorage.getItem(TOKEN_KEY);
		if (!saved) return false;
		this.token = saved;
		return this.validate(saved);
	}

	private async validate(token: string): Promise<boolean> {
		this.status = 'validating';
		this.error = null;
		try {
			this.user = await getViewer(token);
			this.token = token;
			this.status = 'authenticated';
			return true;
		} catch (e) {
			this.status = 'error';
			this.error = e instanceof Error ? e.message : 'Could not validate token.';
			return false;
		}
	}

	/** Validate and persist a token entered by the user. */
	async login(token: string): Promise<boolean> {
		const ok = await this.validate(token.trim());
		if (ok && browser) localStorage.setItem(TOKEN_KEY, token.trim());
		return ok;
	}

	logout(): void {
		this.token = null;
		this.user = null;
		this.status = 'idle';
		this.error = null;
		if (browser) localStorage.removeItem(TOKEN_KEY);
	}
}

export const auth = new AuthStore();
