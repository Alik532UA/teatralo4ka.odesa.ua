class BrandGridThemeState {
	current = $state<'light' | 'dark'>('light');

	toggle() {
		this.current = this.current === 'light' ? 'dark' : 'light';
	}

	set(val: 'light' | 'dark') {
		this.current = val;
	}
}

export const brandGridTheme = new BrandGridThemeState();
