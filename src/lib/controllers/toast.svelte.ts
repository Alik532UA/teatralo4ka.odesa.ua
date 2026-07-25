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
	anchor?: HTMLElement;
}

interface TimerInfo {
	id: number;
	timerId: ReturnType<typeof setTimeout> | null;
	startTime: number;
	elapsed: number;
	duration: number;
	holds: number;
}

const MAX_TOASTS = 4;

class ToastState {
	messages = $state<ToastMessage[]>([]);
	
	// Confirm modal state
	isConfirmOpen = $state(false);
	confirmMessage = $state('');
	private confirmResolve: ((value: boolean) => void) | null = null;

	private nextId = 0;
	private timers = new Map<number, TimerInfo>();

	private _arm(info: TimerInfo) {
		const remaining = Math.max(0, info.duration - info.elapsed);
		info.startTime = Date.now();
		info.timerId = setTimeout(() => this.remove(info.id), remaining);
	}

	add(type: ToastType, message: string, duration = 4000, action?: ToastAction, anchor?: HTMLElement) {
		const id = this.nextId++;
		this.messages.push({ id, type, message, action, duration, anchor });
		if (this.messages.length > MAX_TOASTS) {
			this.remove(this.messages[0].id);
		}
		const info: TimerInfo = { id, timerId: null, startTime: 0, elapsed: 0, duration, holds: 0 };
		this.timers.set(id, info);
		this._arm(info);
	}

	success(message: string, duration = 4000, action?: ToastAction, anchor?: HTMLElement) {
		this.add('success', message, duration, action, anchor);
	}

	error(message: string, duration = 5000, action?: ToastAction, anchor?: HTMLElement) {
		this.add('error', message, duration, action, anchor);
	}

	info(message: string, duration = 4000, action?: ToastAction, anchor?: HTMLElement) {
		this.add('info', message, duration, action, anchor);
	}

	/** Pause on hover OR focus. Reference-counted. */
	pauseTimer(id: number) {
		const info = this.timers.get(id);
		if (!info) return;
		info.holds += 1;
		if (info.holds > 1 || info.timerId === null) return;
		clearTimeout(info.timerId);
		info.elapsed = Math.min(info.elapsed + (Date.now() - info.startTime), info.duration);
		info.timerId = null;
	}

	/** Resume timer when all holds (hover and focus) are released. */
	resumeTimer(id: number) {
		const info = this.timers.get(id);
		if (!info) return;
		if (info.holds > 0) info.holds -= 1;
		if (info.holds > 0 || info.timerId !== null) return;
		this._arm(info);
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