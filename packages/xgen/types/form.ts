import type { Action, Common, Global } from '@/types'

export declare namespace FormType {
	interface Section {
		title?: string
		desc?: string
		columns: Array<Column>
	}

	interface SectionResult {
		title?: string
		desc?: string
		columns: Array<ColumnResult>
	}

	interface RawTab {
		width?: number
		tabs: Array<Section>
	}

	interface TargetTab {
		width?: number
		tabs: Array<SectionResult>
	}

	type Column = Common.BaseColumn | RawTab

	type ColumnResult = Common.EditColumn | TargetTab

	type HookArgs = { api: string; params: Global.AnyObject }
	type HookType = { [key: string]: HookArgs }

	type HookKeys = 'onChange'

	interface Reference {
		flatContent?: {
			name: string
			defaultOpen?: boolean
			payload: Action.OpenModal
		}
		floatContents?: Array<{
			name: string
			payload: Omit<Action.OpenModal, 'width'>
		}>
	}

	interface Setting {
		name: string
		primary: string
		hooks?: {
			[key in HookKeys]: HookType
		}
		actions?: Array<Action.Props>
		form: {
			props: {
				onLoadSync?: boolean
				reference?: Reference
			}
			sections: Array<Section>
		}
		fields: {
			form: Common.EditFields
		}
		config?: Common.Config & {
			showAnchor?: boolean
		}
	}
}
