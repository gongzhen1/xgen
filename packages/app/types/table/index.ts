import type Filter from './filter'
import type Header from './header'
import type Action from './action'
import type { TableProps } from 'antd'
import type { BaseColumn, Fileds, FiledDetail } from './common'

export interface SettingTable {
	header: Header
	filter: Filter
	table: {
		props: TableProps<{}>
		columns: Array<BaseColumn>
		actions: Array<Action>
	}
	fileds: {
		filter: Fileds
		table: Fileds
	}
}

export type Column = BaseColumn & FiledDetail

export { BaseColumn, Fileds, FiledDetail }
