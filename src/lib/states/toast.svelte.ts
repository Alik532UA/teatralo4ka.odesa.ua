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
	duration: number;
}

interface TimerInfo {
	timerId: ReturnType<typeof setTimeout> | null;
	startTime: number;
	elapsed: number;
	duration: number;
}

class ToastState {
	messages = $state<ToastMessage[]>([]);
	
	// Confirm modal state
	isConfirmOpen = $state(false);
	confirmMessage = $state('');
	private confirmResolve: ((value: boolean) => void) | null = null;

	private nextId = 0;
	private timers = new Map<number, TimerInfo>();

	private _startTimer(id: number, duration: number, elapsed: number) {
		const remaining = duration - elapsed;
		const timerId = setTimeout(() => this.remove(id), remaining);
		this.timers.set(id, { timerId, startTime: Date.now(), elapsed, duration });
	}

	add(type: ToastType, message: string, duration = 4000, action?: ToastAction) {
		const id = this.nextId++;
		this.messages.push({ id, type, message, action, duration });
		this._startTimer(id, duration, 0);
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

	pauseTimer(id: number) {
		const info = this.timers.get(id);
		if (!info || info.timerId === null) return;
		clearTimeout(info.timerId);
		const newElapsed = Math.min(info.elapsed + (Date.now() - info.startTime), info.duration);
		this.timers.set(id, { ...info, timerId: null, elapsed: newElapsed });
	}

	resumeTimer(id: number) {
		const info = this.timers.get(id);
		if (!info || info.timerId !== null) return;
		this._startTimer(id, info.duration, info.elapsed);
	}

	getActionLabel(action: ToastAction): string {
		if (typeof action.label === 'string') return action.label;
		return ui.isMobile ? action.label.mobile : action.label.desktop;
	}

	remove(id: number) {
		const info = this.timers.get(id);
		if (info?.timerId) clearTimeout(info.timerId);
		this.timers.delete(id);
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