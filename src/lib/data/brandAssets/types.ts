export interface DownloadOption {
	format: 'PNG' | 'SVG';
	file: string;
	label: string;
	downloadName: string;
	sizeSpec?: string;
}

export interface BrandAsset {
	id: string;
	nameUk: string;
	nameEn: string;
	descUk?: string;
	descEn?: string;
	previewUrl: string;
	downloads: DownloadOption[];
}

export interface BigEmblemVariant {
	id: string;
	year: '2022' | '2025';
	colorScheme: 'color' | 'white' | 'outline';
	handsType: 'color' | 'white' | 'outline';
	hasBg: boolean;
	nameUk: string;
	nameEn: string;
	previewUrl: string;
	fullFile: string;
	downloadName: string;
	resolution: string;
	svgFile?: string;
}

export interface MiniIconItem {
	id: number;
	code: string;
	nameUk: string;
	nameEn: string;
	svgFile: string;
	pngFile: string;
}
