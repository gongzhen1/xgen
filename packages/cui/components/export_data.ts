/**
 * The static component export data (styles etc.) used by the build script
 * and by `components/exports.ts`.
 *
 * NOTE: This module must NOT import any component/browser code — it is loaded
 * by `build/components.ts` which runs in Node (tsx). Component imports that are
 * only needed to force webpack to include modules belong in `components/exports.ts`.
 */

export interface ExportComponent {
	styles: string[]
}

export const ExportComponents: Record<string, ExportComponent> = {
	'edit/Upload': {
		styles: [
			'@/icon_font.css',
			'@/assets/css/vidstack/theme.css',
			'@/assets/css/vidstack/layouts/audio.css',
			'@/assets/css/vidstack/layouts/video.css',
			'/components/edit/Upload/index.less'
		]
	}
}
