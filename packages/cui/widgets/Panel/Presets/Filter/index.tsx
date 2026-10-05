import { Icon } from '@/widgets'
import { Input } from 'antd'
import styles from './index.less'
import clsx from 'clsx'
import { getLocale } from '@umijs/max'

interface IProps {
	onChange: (value: string) => void
}

const Index = (props: IProps) => {
	const is_cn = getLocale() === 'zh-CN'
	const placeholder = is_cn ? '搜索' : 'Search'
	return (
		<div className={clsx([styles._local])}>
			<Input
				placeholder={placeholder}
				prefix={<Icon name='icon-search' size={14} />}
				allowClear
				onPressEnter={(e) => props.onChange((e.target as HTMLInputElement).value)}
				onChange={(e) => {
					// 清空（含 allowClear 点击）时立即重置过滤，避免输入框与列表状态不一致
					if (e.target.value === '') props.onChange('')
				}}
				style={{ width: 160 }}
			/>
		</div>
	)
}

export default window.$app.memo(Index)
