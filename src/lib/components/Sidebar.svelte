<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { data } from '$lib/stores/data.svelte';
	import { toggleMode } from 'mode-watcher';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import type { Tag, ViewKind } from '$lib/types';
	import Star from '@lucide/svelte/icons/star';
	import Inbox from '@lucide/svelte/icons/inbox';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Plus from '@lucide/svelte/icons/plus';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import SunMoon from '@lucide/svelte/icons/sun-moon';
	import Database from '@lucide/svelte/icons/database';
	import LogOut from '@lucide/svelte/icons/log-out';

	// Dialogs live in the parent (AppShell) so they survive the mobile drawer closing.
	// The sidebar just signals intent; the parent owns the dialog state and the closing.
	let {
		onnavigate,
		onNewTag,
		onEditTag,
		onRequestDelete,
		onOpenBackup
	}: {
		onnavigate?: () => void;
		onNewTag?: () => void;
		onEditTag?: (tag: Tag) => void;
		onRequestDelete?: (tag: Tag) => void;
		onOpenBackup?: () => void;
	} = $props();

	function isActive(view: ViewKind): boolean {
		const v = data.view;
		if (v.kind !== view.kind) return false;
		if ((v.kind === 'tag' || v.kind === 'smart') && (view.kind === 'tag' || view.kind === 'smart'))
			return v.tagId === view.tagId;
		return true;
	}

	const navBase = 'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors';

	function navigate(view: ViewKind) {
		data.setView(view);
		onnavigate?.();
	}
	function toggleLanguage(name: string) {
		data.languageFilter = data.languageFilter === name ? null : name;
		onnavigate?.();
	}
</script>

{#snippet tagRow(tag: Tag, kind: 'tag' | 'smart', count: number)}
	<div
		class="group flex items-center rounded-md pr-1 {isActive({ kind, tagId: tag.id })
			? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
			: 'hover:bg-sidebar-accent/50'}"
	>
		<button
			type="button"
			class="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-sm"
			onclick={() => navigate({ kind, tagId: tag.id })}
		>
			{#if kind === 'smart'}
				<Sparkles class="size-3.5 shrink-0" style="color: {tag.color};" />
			{:else}
				<span class="size-3 shrink-0 rounded-full" style="background-color: {tag.color};"></span>
			{/if}
			<span class="truncate">{tag.name}</span>
		</button>
		<span class="text-muted-foreground px-1 text-xs tabular-nums group-hover:hidden">{count}</span>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="text-muted-foreground hover:text-foreground flex size-6 items-center justify-center rounded lg:hidden lg:group-hover:flex data-[state=open]:flex"
				aria-label="Options for {tag.name}"
			>
				<Ellipsis class="size-4" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Item onSelect={() => onEditTag?.(tag)}><Pencil /> Edit</DropdownMenu.Item>
				<DropdownMenu.Item onSelect={() => onRequestDelete?.(tag)}><Trash2 /> Delete</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
{/snippet}

<aside class="bg-sidebar text-sidebar-foreground flex h-svh w-64 shrink-0 flex-col border-r">
	<!-- Header -->
	<div class="flex items-center gap-2 border-b p-3">
		<Star class="size-5 shrink-0 fill-yellow-400 text-yellow-400" />
		<span class="font-semibold">Sidereum</span>
		<div class="ml-auto">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
					aria-label="Account menu"
				>
					<Avatar.Root class="size-6">
						<Avatar.Image src={auth.user?.avatarUrl} alt={auth.user?.login} />
						<Avatar.Fallback class="text-xs">
							{auth.user?.login?.[0]?.toUpperCase() ?? '?'}
						</Avatar.Fallback>
					</Avatar.Root>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="w-56">
					<DropdownMenu.Label>
						<div class="flex flex-col">
							<span class="truncate">{auth.user?.name ?? auth.user?.login}</span>
							<span class="text-muted-foreground text-xs font-normal">@{auth.user?.login}</span>
						</div>
					</DropdownMenu.Label>
					<DropdownMenu.Separator />
					<DropdownMenu.Item onSelect={() => onOpenBackup?.()}>
						<Database /> Backup &amp; sync
					</DropdownMenu.Item>
					<DropdownMenu.Item onSelect={toggleMode}>
						<SunMoon /> Toggle theme
					</DropdownMenu.Item>
					<DropdownMenu.Separator />
					<DropdownMenu.Item onSelect={() => auth.logout()}>
						<LogOut /> Log out
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>

	<!-- Navigation -->
	<div class="min-h-0 flex-1 overflow-y-auto p-2">
		<nav class="space-y-0.5">
			<button
				class="{navBase} {isActive({ kind: 'all' })
					? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
					: 'hover:bg-sidebar-accent/50'}"
				onclick={() => navigate({ kind: 'all' })}
			>
				<Star class="size-4" /> All stars
				<span class="text-muted-foreground ml-auto text-xs tabular-nums">{data.stars.length}</span>
			</button>
			<button
				class="{navBase} {isActive({ kind: 'untagged' })
					? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
					: 'hover:bg-sidebar-accent/50'}"
				onclick={() => navigate({ kind: 'untagged' })}
			>
				<Inbox class="size-4" /> Untagged
				<span class="text-muted-foreground ml-auto text-xs tabular-nums">{data.untaggedCount}</span>
			</button>
		</nav>

		<!-- Tags -->
		<div class="mt-5">
			<div class="flex items-center justify-between px-2 pb-1">
				<span class="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Tags</span>
				<button
					class="text-muted-foreground hover:text-foreground"
					onclick={() => onNewTag?.()}
					aria-label="New tag"
				>
					<Plus class="size-3.5" />
				</button>
			</div>
			<div class="space-y-0.5">
				{#each data.manualTags as tag (tag.id)}
					{@render tagRow(tag, 'tag', data.tagCount(tag.id))}
				{/each}
				{#if data.manualTags.length === 0}
					<button
						class="text-muted-foreground hover:text-foreground px-2 py-1 text-left text-xs"
						onclick={() => onNewTag?.()}
					>
						+ Add your first tag
					</button>
				{/if}
			</div>
		</div>

		<!-- Smart tags -->
		{#if data.smartTags.length}
			<div class="mt-5">
				<span class="text-muted-foreground px-2 text-xs font-semibold tracking-wide uppercase">
					Smart tags
				</span>
				<div class="mt-1 space-y-0.5">
					{#each data.smartTags as tag (tag.id)}
						{@render tagRow(tag, 'smart', data.smartCount(tag))}
					{/each}
				</div>
			</div>
		{/if}

		<!-- Languages -->
		{#if data.languages.length}
			<div class="mt-5">
				<span class="text-muted-foreground px-2 text-xs font-semibold tracking-wide uppercase">
					Languages
				</span>
				<div class="mt-1 space-y-0.5">
					{#each data.languages as lang (lang.name)}
						<button
							class="{navBase} {data.languageFilter === lang.name
								? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
								: 'hover:bg-sidebar-accent/50'}"
							onclick={() => toggleLanguage(lang.name)}
						>
							<span
								class="size-3 shrink-0 rounded-full"
								style="background-color: {lang.color ?? '#888'};"
							></span>
							<span class="truncate">{lang.name}</span>
							<span class="text-muted-foreground ml-auto text-xs tabular-nums">{lang.count}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Footer -->
	<div class="border-t p-2">
		<Button variant="ghost" size="sm" class="w-full justify-start" onclick={() => onOpenBackup?.()}>
			<Database /> Backup &amp; sync
		</Button>
	</div>
</aside>
