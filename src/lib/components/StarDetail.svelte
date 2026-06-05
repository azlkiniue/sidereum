<script lang="ts">
	import type { Star } from '$lib/types';
	import { data } from '$lib/stores/data.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import TagBadge from './TagBadge.svelte';
	import TagPicker from './TagPicker.svelte';
	import NoteEditor from './NoteEditor.svelte';
	import { compactNumber, timeAgo } from '$lib/utils/format';
	import StarIcon from '@lucide/svelte/icons/star';
	import GitFork from '@lucide/svelte/icons/git-fork';
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import Scale from '@lucide/svelte/icons/scale';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Link2 from '@lucide/svelte/icons/link-2';
	import Archive from '@lucide/svelte/icons/archive';
	import GitForkIcon from '@lucide/svelte/icons/git-fork';

	let { star }: { star: Star } = $props();

	let assignedTags = $derived(data.tagsForRepo(star.id));
	let smartMatches = $derived(data.smartTagsForRepo(star));
</script>

<div class="flex h-full min-h-0 flex-col overflow-y-auto">
	<div class="mx-auto w-full max-w-3xl space-y-6 p-6">
		<!-- Header -->
		<div class="space-y-3">
			<div class="flex items-start justify-between gap-3">
				<div class="min-w-0">
					<a
						href={star.url}
						target="_blank"
						rel="noreferrer"
						class="group inline-flex items-center gap-1.5 text-xl font-bold break-all hover:underline"
					>
						<span class="text-muted-foreground font-normal">{star.owner}/</span>{star.name}
						<ExternalLink class="size-4 shrink-0 opacity-0 transition group-hover:opacity-60" />
					</a>
					<div class="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
						{#if star.isArchived}
							<span
								class="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 font-medium text-amber-600 dark:text-amber-500"
							>
								<Archive class="size-3" /> Archived
							</span>
						{/if}
						{#if star.isFork}
							<span class="inline-flex items-center gap-1"><GitForkIcon class="size-3" /> Fork</span>
						{/if}
						{#if star.isPrivate}
							<span class="rounded bg-muted px-1.5 py-0.5 font-medium">Private</span>
						{/if}
					</div>
				</div>
				<a
					href={star.url}
					target="_blank"
					rel="noreferrer"
					class={buttonVariants({ variant: 'outline', size: 'sm' })}
				>
					<ExternalLink /> GitHub
				</a>
			</div>

			{#if star.description}
				<p class="text-sm leading-relaxed">{star.description}</p>
			{/if}

			{#if star.homepageUrl}
				<a
					href={star.homepageUrl}
					target="_blank"
					rel="noreferrer"
					class="text-primary inline-flex max-w-full items-center gap-1 text-xs hover:underline"
				>
					<Link2 class="size-3 shrink-0" />
					<span class="truncate">{star.homepageUrl}</span>
				</a>
			{/if}

			<!-- Stats -->
			<div class="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
				{#if star.primaryLanguage}
					<span class="flex items-center gap-1.5">
						<span
							class="size-2.5 rounded-full"
							style="background-color: {star.languageColor ?? '#888'};"
						></span>
						{star.primaryLanguage}
					</span>
				{/if}
				<span class="flex items-center gap-1"><StarIcon class="size-3.5" />{compactNumber(star.stargazerCount)}</span>
				<span class="flex items-center gap-1"><GitFork class="size-3.5" />{compactNumber(star.forkCount)}</span>
				<span class="flex items-center gap-1"><CircleDot class="size-3.5" />{compactNumber(star.openIssuesCount)} issues</span>
				{#if star.licenseName}
					<span class="flex items-center gap-1"><Scale class="size-3.5" />{star.licenseName}</span>
				{/if}
			</div>
			<div class="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
				<span>Starred {timeAgo(star.starredAt)}</span>
				{#if star.pushedAt}<span>Updated {timeAgo(star.pushedAt)}</span>{/if}
				{#if star.createdAt}<span>Created {timeAgo(star.createdAt)}</span>{/if}
			</div>

			{#if star.topics.length}
				<div class="flex flex-wrap gap-1.5">
					{#each star.topics as topic (topic)}
						<span class="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">{topic}</span>
					{/each}
				</div>
			{/if}
		</div>

		<Separator />

		<!-- Tags -->
		<div class="space-y-2">
			<h2 class="text-sm font-semibold">Tags</h2>
			<div class="flex flex-wrap items-center gap-1.5">
				{#each assignedTags as tag (tag.id)}
					<TagBadge {tag} removable onremove={() => data.toggleTag(star.id, tag.id)} />
				{/each}
				<TagPicker repoId={star.id} />
			</div>
			{#if smartMatches.length}
				<div class="flex flex-wrap items-center gap-1.5 pt-1">
					<span class="text-muted-foreground text-xs">Auto:</span>
					{#each smartMatches as tag (tag.id)}
						<TagBadge {tag} />
					{/each}
				</div>
			{/if}
		</div>

		<Separator />

		<!-- Notes -->
		<div class="space-y-2">
			<h2 class="text-sm font-semibold">Notes</h2>
			{#key star.id}
				<NoteEditor {star} />
			{/key}
		</div>
	</div>
</div>
