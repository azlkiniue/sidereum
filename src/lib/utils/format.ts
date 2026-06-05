/** 1234 -> "1.2k", 1500000 -> "1.5M" */
export function compactNumber(n: number): string {
	return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** Short relative time, e.g. "3d ago", "2mo ago". */
export function timeAgo(iso: string | null): string {
	if (!iso) return '';
	const then = new Date(iso).getTime();
	if (Number.isNaN(then)) return '';
	const sec = Math.round((Date.now() - then) / 1000);
	const min = Math.round(sec / 60);
	const hr = Math.round(min / 60);
	const day = Math.round(hr / 24);
	const mon = Math.round(day / 30);
	const yr = Math.round(day / 365);
	if (sec < 45) return 'just now';
	if (min < 60) return `${min}m ago`;
	if (hr < 24) return `${hr}h ago`;
	if (day < 30) return `${day}d ago`;
	if (mon < 12) return `${mon}mo ago`;
	return `${yr}y ago`;
}

/** Choose black or white text for legibility on a given hex background. */
export function readableText(hex: string): string {
	const c = hex.replace('#', '');
	if (c.length < 6) return '#fff';
	const r = parseInt(c.slice(0, 2), 16);
	const g = parseInt(c.slice(2, 4), 16);
	const b = parseInt(c.slice(4, 6), 16);
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.6 ? '#000000' : '#ffffff';
}
