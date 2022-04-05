import type Model from '@/components/base/Table/model'
import type { TableColumnType } from 'antd'
import type { Column } from '@/types'

export interface IPropsPureTable {
	parent: Model['parent']
	namespace: Model['namespace']['value']
	list: Model['list']
	columns: Model['table_columns']
	pagination: Model['pagination']
	props: Model['setting']['table']['props']
	operation: Model['setting']['table']['operation']
}

export type TableColumn = TableColumnType<any>

export interface IPropsEditPopover {
	namespace: Model['namespace']['value']
	field_detail: Column
	data_item: any
	form_value: any
	row_index: number
}

export interface IPropsViewContent {
	namespace: Model['namespace']['value']
	field_detail: Column
	data_item: any
	form_value: any
}

export interface IPropsActions {
	namespace: Model['namespace']['value']
	actions: Model['setting']['table']['operation']['actions']
	data_item: any
}

export interface Locale {
	[key: string]: {
		pagination: {
			total: {
				before: string
				after: string
			}
		}
	}
}
