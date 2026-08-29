/**
 * The components for shadow dom and dynamic import
 */
// Force webpack to include these components in the module graph
import '@/components/edit/Timeline'

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

export interface ExportComponent {
	styles: string[]
}
