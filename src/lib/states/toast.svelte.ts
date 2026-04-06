export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
	id: number;
	type: ToastType;
	message: string;
}

class ToastState {
	messages = $state<ToastMessage[]>([]);
	
	// Confirm modal state
	isConfirmOpen = $state(false);
	confirmMessage = $state('');
	private confirmResolve: ((value: boolean) => void) | null = null;

	private nextId = 0;

	add(type: ToastType, message: string, duration = 4000) {
		const id = this.nextId++;
		this.messages.push({ id, type, message });
		
		setTimeout(() => {
			this.remove(id);
		}, duration);
	}

	success(message: string, duration = 4000) {
		this.add('success', message, duration);
	}

	error(message: string, duration = 5000) {
		this.add('error', message, duration);
	}

	info(message: string, duration = 4000) {
		this.add('info', message, duration);
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