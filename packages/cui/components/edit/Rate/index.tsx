import { Rate } from 'antd'
import { useState } from 'react'

import { Item } from '@/components'

import styles from './index.less'

import type { Component } from '@/types'
import type { RateProps } from 'antd'

interface IProps extends RateProps, Component.PropsEditComponent {
	/**
	 * 默认评分(星数),表单未注入值时使用
	 * 在 .yao 配置中通过 edit.props.defaultValue 指定
	 */
	defaultValue?: number
}

interface InnerProps extends RateProps {
	defaultValue?: number
	value?: number
	onChange?: (value: number) => void
}

// 内部受控组件:在 antd Form.Item 受控模式下让 defaultValue 生效
// Form.Item 会向直接子组件注入 value/onChange,这里做合并与默认值兜底
const Inner = window.$app.memo((props: InnerProps) => {
	const { value, onChange, defaultValue, ...rest_props } = props
	const [innerValue, setInnerValue] = useState<number>(defaultValue ?? 0)

	// 表单注入的 value 优先,未注入时回退到内部默认值
	const current = value ?? innerValue

	const handleChange = (v: number) => {
		setInnerValue(v)
		onChange?.(v)
	}

	return <Rate className={styles._local} value={current} onChange={handleChange} {...rest_props} />
})

const Index = (props: IProps) => {
	const { __bind, __name, itemProps, ...rest_props } = props

	return (
		<Item {...itemProps} {...{ __bind, __name }}>
			<Inner {...rest_props} />
		</Item>
	)
}

export default window.$app.memo(Index)
