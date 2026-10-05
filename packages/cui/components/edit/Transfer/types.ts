import type { TransferProps } from 'antd'
import type { Component } from '@/types'

export declare namespace XTransfer {
	/** 单侧（左候选/右已选）的远程数据源与搜索配置 */
	interface SideApi {
		remote: Component.Request
		search?: Component.Request & { key: string }
	}

	interface XProps {
		/** 左右两侧独立远程配置 */
		left: SideApi
		right: SideApi
		/** 需要从当前表单数据中取值并合并进请求参数的字段名（如 team_id） */
		bindParams?: string[]
		/** 两侧每页条数（默认 10） */
		pageSize?: number
	}
}

export interface IProps extends Component.PropsEditComponent, Omit<TransferProps, 'className'> {}

export interface ICustom extends Omit<TransferProps, 'className'> {
	__name: string
	xProps: XTransfer.XProps
}
