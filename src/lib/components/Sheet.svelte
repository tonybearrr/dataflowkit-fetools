<script lang="ts">
	import { X } from 'lucide-svelte';

	interface Props {
		open?: boolean;
		onClose?: () => void;
		title?: string;
		children?: any;
	}

	let { open = $bindable(false), onClose, title, children }: Props = $props();

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose?.();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			onClose?.();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-start justify-end bg-black/20 backdrop-blur-sm"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? 'sheet-title' : undefined}
	>
		<div
			class="h-full w-full max-w-md bg-[var(--color-bg)] shadow-2xl overflow-hidden flex flex-col animate-slide-in"
		>
			<!-- Header -->
			<div class="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
				{#if title}
					<h2 id="sheet-title" class="text-lg font-semibold text-[var(--color-text)]">
						{title}
					</h2>
				{/if}
				<button
					type="button"
					onclick={onClose}
					class="p-2 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors"
					aria-label="Close"
				>
					<X size={20} class="text-[var(--color-text-muted)]" />
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-6">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-in {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	.animate-slide-in {
		animation: slide-in 0.3s ease-out;
	}
</style>

