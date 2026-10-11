import { browser } from '$app/environment';

/**
 * Whether GitHub is reachable right now. Follows the browser's online/offline events, and
 * every GitHub request reports in too (see `$lib/github/client`): `navigator.onLine` only
 * knows about the local network, so it can say "online" on Wi-Fi with no internet behind it.
 */
class NetworkStore {
	online = $state(browser ? navigator.onLine : true);

	constructor() {
		if (!browser) return;
		window.addEventListener('online', () => (this.online = true));
		window.addEventListener('offline', () => (this.online = false));
	}
}

export const network = new NetworkStore();
