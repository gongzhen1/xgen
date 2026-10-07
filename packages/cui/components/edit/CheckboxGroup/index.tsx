import { Checkbox } from 'antd'
import { observer } from 'mobx-react-lite'
import { useLayoutEffect, useMemo, useState } from 'react'
import { container } from 'tsyringe'

import { Item } from '@/components'

import styles from './index.less'
import Model from './model'

import type { Component } from '@/types'

const { Group } = Checkbox

type IProps = typeof Group & Component.PropsEditComponent & {}

interface GroupedOption {
	group: string
	options: Array<{ label: string; value: string }>
}

interface CustomProps {
	groups: GroupedOption[]
	value?: string[]
	onChange?: (vals: string[]) => void
}

// JSON 类型字段（如角色的 permissions）后端可能是数组，也可能返回 JSON 字符串，统一成字符串数组
const toValueArray = (value: any): string[] => {
	if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean)

	if (typeof value === 'string' && value) {
		try {
			const parsed = JSON.parse(value)
			if (Array.isArray(parsed)) return parsed.map((v) => String(v)).filter(Boolean)
		} catch (e) {
			// 非 JSON 字符串按空处理
		}
	}

	return []
}

// 分组视图。必须是 Form.Item 的直接子元素：Form.Item 通过 cloneElement 把 value/onChange
// 注入到直接子元素上，若子元素是普通 div，注入会丢失（表现为选中项恒为空、点击无响应）。
const Custom = window.$app.memo((props: CustomProps) => {
	const value = toValueArray(props.value)

	// 组勾选框：未全选时勾选=全选本组；已全选时再点=反选（清空本组）。半选状态自动展示
	const toggleGroup = (groupValues: string[], allChecked: boolean) => {
		if (!props.onChange) return

		const set = new Set(value)

		if (allChecked) {
			groupValues.forEach((v) => set.delete(v))
		} else {
			groupValues.forEach((v) => set.add(v))
		}

		props.onChange(Array.from(set))
	}

	return (
		<div className={styles.grouped}>
			{props.groups.map((g) => {
				const groupValues = g.options.map((o) => o.value)
				const checkedCount = groupValues.filter((v) => value.includes(v)).length
				const allChecked = groupValues.length > 0 && checkedCount === groupValues.length

				return (
					<div className={styles.groupBlock} key={g.group}>
						<div className={styles.groupHeader}>
							<Checkbox
								checked={allChecked}
								indeterminate={checkedCount > 0 && !allChecked}
								onChange={() => toggleGroup(groupValues, allChecked)}
							>
								<span className={styles.groupTitle}>{g.group}</span>
							</Checkbox>
							<span className={styles.groupCount}>
								{checkedCount}/{groupValues.length}
							</span>
						</div>
						<Group
							className={styles.groupItems}
							value={groupValues.filter((v) => value.includes(v))}
							onChange={(vals) => {
								if (!props.onChange) return

								const set = new Set(value)

								groupValues.forEach((v) => set.delete(v))
								;(vals as string[]).forEach((v) => set.add(v))

								props.onChange(Array.from(set))
							}}
						>
							{g.options.map((o) => (
								<Checkbox value={o.value} key={o.value} title={o.value}>
									{o.label}
								</Checkbox>
							))}
						</Group>
					</div>
				)
			})}
		</div>
	)
})

const Index = (props: IProps) => {
	const { __bind, __name, itemProps, ...rest_props } = props
	const [x] = useState(() => container.resolve(Model))

	useLayoutEffect(() => {
		x.remote.raw_props = props

		x.remote.init()
	}, [props])

	// 若选项带 group 字段则按分组渲染（如权限点按业务分组展示）
	const grouped = useMemo(() => {
		const opts = (x.options || []) as Array<{ label: string; value: string; group?: string }>
		if (!opts.length || opts.every((o) => !o.group)) return null

		const map: Record<string, Array<{ label: string; value: string }>> = {}
		opts.forEach((o) => {
			const g = o.group || '其他'
			if (!map[g]) map[g] = []
			map[g].push({ label: o.label, value: o.value })
		})
		return Object.keys(map).map((g) => ({ group: g, options: map[g] }))
	}, [x.options])

	return (
		<Item className={styles._local} {...itemProps} {...{ __bind, __name }}>
			{grouped ? <Custom groups={grouped} /> : <Group {...rest_props} options={x.options}></Group>}
		</Item>
	)
}

export default new window.$app.Handle(Index).by(observer).by(window.$app.memo).get()
