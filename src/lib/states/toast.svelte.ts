import { ui } from './ui.svelte';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastAction {
	label: string | { mobile: string; desktop: string };
	onAction: () => void;
}

export interface ToastMessage {
	id: number;
	type: ToastType;
	message: string;
	action?: ToastAction;
}

class ToastState {
	messages = $state<ToastMessage[]>([]);
	
	// Confirm modal state
	isConfirmOpen = $state(false);
	confirmMessage = $state('');
	private confirmResolve: ((value: boolean) => void) | null = null;

	private nextId = 0;

	add(type: ToastType, message: string, duration = 4000, action?: ToastAction) {
		const id = this.nextId++;
		this.messages.push({ id, type, message, action });
		
		setTimeout(() => {
			this.remove(id);
		}, duration);
	}

	success(message: string, duration = 4000, action?: ToastAction) {
		this.add('success', message, duration, action);
	}

	error(message: string, duration = 5000, action?: ToastAction) {
		this.add('error', message, duration, action);
	}

	info(message: string, duration = 4000, action?: ToastAction) {
		this.add('info', message, duration, action);
	}

	getActionLabel(action: ToastAction): string {
		if (typeof action.label === 'string') return action.label;
		return ui.isMobile ? action.label.mobile : action.label.desktop;
	}

	remove(id: number) {
		const index = this.messages.findIndex(m => m.id === id);
		if (index !== -1) {
			this.messages.splice(index, 1);
		}
	}

	// Confirm Dialog API
	async confirm(message: string): Promise<boolean> {
		this.confirmMessage = message;
		this.isConfirmOpen = true;

		return new Promise((resolve) => {
			this.confirmResolve = resolve;
		});
	}

	resolveConfirm(value: boolean) {
		this.isConfirmOpen = false;
		if (this.confirmResolve) {
			this.confirmResolve(value);
			this.confirmResolve = null;
		}
	}
}

export const toast = new ToastState();