class SEOService {
	title = $state("Одеська театральна школа");
	description = $state("Одеська театральна школа — фортепіано, вокал, інструментальні ансамблі. Класична музична освіта для дітей та молоді в Одесі.");
	ogImage = $state("/logo/png/logo-800px484px.png");

	update(config: { title?: string; description?: string; ogImage?: string }) {
		if (config.title) {
			this.title = `${config.title} | ОТШ`;
		} else {
			this.title = "Одеська театральна школа";
		}

		if (config.description) {
			this.description = config.description;
		}

		if (config.ogImage) {
			this.ogImage = config.ogImage;
		}
	}
}

export const seo = new SEOService();
