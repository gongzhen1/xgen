import { Tooltip } from 'antd'
import { Fragment } from 'react'

import { useAction } from '@/actions'
import { Icon } from '@/widgets'

import type { IPropsActions } from '../types'

const Index = (props: IPropsActions) => {
	const { actions } = props
	const onAction = useAction()

	// 顶部操作按钮没有行数据（data_item=null），将当前 URL query 作为模板数据透传，
	// 供 payload 中的 {{team_id}} 等变量渲染（见 actions/Common/openModal、historyPush）
	const getQuery = () => {
		try {
			return Object.fromEntries(new URLSearchParams(window.location.search))
		} catch (e) {
			return {}
		}
	}

	return (
		<Fragment>
			{actions?.map((it, index) => (
				<Tooltip title={it.title} placement='bottom' key={index}>
					<a
						className='option_item cursor_point flex justify_center align_center transition_normal clickable'
						onClick={() =>
							onAction({
								namespace: '',
								primary: '',
								data_item: null,
								it,
								extra: { query: getQuery() }
							})
						}
					>
						<Icon className='icon_option' name={it.icon} size={18}></Icon>
					</a>
				</Tooltip>
			))}
		</Fragment>
	)
}

export default window.$app.memo(Index)
