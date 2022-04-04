import { Popover } from 'antd'
import clsx from 'clsx'

import { useActionDisabled, useActionStyle } from '@/hooks'
import { Icon } from '@/widgets'

import styles from './index.less'

import type { IPropsActions } from '../../types'

const Index = (props: IPropsActions) => {
	const { actions, data_item } = props

	const getStyle = useActionStyle()
	const getDisabled = useActionDisabled(data_item)

	const Content = (
		<div className={clsx([styles.table_option_items, 'flex flex_column'])}>
			{actions.map((it, index) => (
				<div
					className={clsx([
						'table_option_item flex align_center cursor_point',
						getStyle(it.props.style),
						getDisabled(it.props.disabled)
					])}
					key={index}
				>
					<Icon name={it.icon} size={13}></Icon>
					<span className='text'>{it.title}</span>
				</div>
			))}
		</div>
	)

	return (
		<div className={clsx([styles._local, 'flex justify_end'])}>
			<Popover
				id='td_popover'
				placement='bottomRight'
				overlayClassName={styles.options_popover}
				trigger='click'
				zIndex={1000}
				destroyTooltipOnHide={{ keepParent: false }}
				content={Content}
				align={{ offset: [6, -10] }}
				autoAdjustOverflow={false}
			>
				<a className='option_icon_wrap flex justify_center align_center clickable'>
					<Icon name='icon-more-vertical' size={18}></Icon>
				</a>
			</Popover>
		</div>
	)
}

export default window.$app.memo(Index)
