export declare namespace Common {
	interface Config {
		full?: boolean
		[key: string]: any
	}

	interface BaseColumn {
		name: string
		width?: number
		icon?: string | { name: string; size?: number }
		color?: string
		weight?: number | string
	}

	interface TableBaseColumn extends BaseColumn {
		fixed?: boolean
	}

	interface WideColumn {
		name: string
		width: number
	}

	interface ViewComponents {
		[key: string]: string | FieldDetail
	}

	interface AIConfig {
		placeholder?: string
		params?: Record<string, any>
	}

	interface FieldDetail {
		id: string
		bind: string
		hideLabel?: boolean
		view: {
			bind?: string
			hideLabel?: boolean
			type: string
			props: any & { components?: ViewComponents }
		}
		edit: {
			bind?: string
			hideLabel?: boolean
			type: string
			props: any & { ai?: AIConfig }
		}
	}

	type ViewFieldDetail = Omit<FieldDetail, 'edit'>
	type EditFieldDetail = Omit<FieldDetail, 'view'>

	interface Fields {
		[key: string]: FieldDetail
	}

	interface ViewFields {
		[key: string]: ViewFieldDetail
	}

	interface EditFields {
		[key: string]: EditFieldDetail
	}

	interface Column extends BaseColumn, FieldDetail {}
	interface TableColumn extends TableBaseColumn, FieldDetail {}
	// view-only 字段：Yao form DSL 允许字段只配置 view（如详情页 Tag/Text），此时 edit 缺省
	interface EditColumn extends BaseColumn, EditFieldDetail {
		view?: FieldDetail['view']
	}
}
