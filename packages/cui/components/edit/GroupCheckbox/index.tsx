import { Button, Checkbox, Empty, Input, Modal, Tag } from 'antd'
import {
	CheckCircleFilled,
	DownOutlined,
	ReloadOutlined,
	RightOutlined,
	SearchOutlined,
} from '@ant-design/icons'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { container } from 'tsyringe'

import { Item } from '@/components'

import styles from './index.less'
import Model from './model'

import type { Component } from '@/types'

interface GroupedOption {
	label: string
	value: string
	group?: string
}

// 统一把后端值转成字符串数组：兼容数组、JSON 数组字符串、逗号分隔串
const toValueArray = (value: any): string[] => {
	if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean)
	if (typeof value === 'string' && value) {
		try {
			const parsed = JSON.parse(value)
			if (Array.isArray(parsed)) return parsed.map((v) => String(v)).filter(Boolean)
		} catch (e) {
			return value.split(',').map((v) => v.trim()).filter(Boolean)
		}
	}
	return []
}

// 标签形如 “分组 / 中文名（英文代码）”，展示时只取中文名，完整内容放到 tooltip
const parseLabel = (raw: string) => {
	const matched = /^(.+?)\s*\/\s*(.+?)（([^（）]+)）$/.exec(raw)
	if (matched) return { name: matched[2].trim(), code: matched[3].trim(), raw }
	const simple = /^(.+?)（([^（）]+)）$/.exec(raw)
	if (simple) return { name: simple[1].trim(), code: simple[2].trim(), raw }
	return { name: raw, code: '', raw }
}

interface ICustomProps {
	value?: string | string[]
	onChange?: (v: string | string[]) => void
	valueFormat?: 'csv'
	placeholder?: string
	/** 表单字段名称（取 __name），用于弹窗标题/占位文案，避免硬编码“权限点” */
	fieldName?: string
	options: GroupedOption[]
}

// 内部组件：必须是 Form.Item 的直接且唯一子元素，Form.Item 通过 cloneElement
// 把 value/onChange 注入到这里。若 <Item> 有多个子元素，注入会落到第一个 div 上被丢弃。
export const Custom = window.$app.memo((props: ICustomProps) => {
	const { value, onChange, valueFormat, placeholder, fieldName, options } = props
	const label = fieldName || '选项'
	const [open, setOpen] = useState(false)
	const [draft, setDraft] = useState<string[]>(toValueArray(value))
	const [keyword, setKeyword] = useState('')
	const [collapsed, setCollapsed] = useState<string[]>([])
	const bodyRef = useRef<HTMLDivElement>(null)

	// 外部 value 变化时同步草稿（仅 Modal 关闭时）
	useEffect(() => {
		if (!open) setDraft(toValueArray(value))
	}, [value, open])

	useEffect(() => {
		bodyRef.current?.scrollTo({ top: 0 })
	}, [keyword])

	const selectedSet = useMemo(() => new Set(draft), [draft])
	const normalizedKeyword = keyword.trim().toLowerCase()

	const filteredGroups = useMemo(() => {
		const map: Record<string, GroupedOption[]> = {}
		options.forEach((o) => {
			const g = o.group || '其他'
			if (!map[g]) map[g] = []
			map[g].push(o)
		})
		return Object.keys(map)
			.map((g) => ({ group: g, options: map[g] }))
			.map((group) => {
				const groupHit = !normalizedKeyword || group.group.toLowerCase().includes(normalizedKeyword)
				const points = group.options.filter((o) => {
					if (!normalizedKeyword) return true
					return groupHit || o.label.toLowerCase().includes(normalizedKeyword) || o.value.toLowerCase().includes(normalizedKeyword)
				})
				return { group: group.group, options: points }
			})
			.filter((g) => g.options.length > 0)
	}, [options, normalizedKeyword])

	const visibleCodes = useMemo(() => filteredGroups.flatMap((g) => g.options.map((o) => o.value)), [filteredGroups])
	const allVisibleSelected = visibleCodes.length > 0 && visibleCodes.every((c) => selectedSet.has(c))
	const someVisibleSelected = visibleCodes.some((c) => selectedSet.has(c))

	const togglePoint = useCallback((code: string) => {
		setDraft((prev) => (prev.includes(code) ? prev.filter((v) => v !== code) : [...prev, code]))
	}, [])

	const toggleCodes = useCallback((codes: string[], checked: boolean) => {
		setDraft((prev) => {
			const set = new Set(prev)
			codes.forEach((c) => (checked ? set.add(c) : set.delete(c)))
			return Array.from(set)
		})
	}, [])

	const toggleCollapse = (g: string) => {
		setCollapsed((prev) => (prev.includes(g) ? prev.filter((v) => v !== g) : [...prev, g]))
	}

	const highlight = (text: string) => {
		if (!normalizedKeyword) return text
		const idx = text.toLowerCase().indexOf(normalizedKeyword)
		if (idx < 0) return text
		return (
			<>
				{text.slice(0, idx)}
				<mark className={styles.highlight}>{text.slice(idx, idx + normalizedKeyword.length)}</mark>
				{text.slice(idx + normalizedKeyword.length)}
			</>
		)
	}

	const emit = (vals: string[]) => {
		if (!onChange) return
		onChange(valueFormat === 'csv' ? vals.join(',') : vals)
	}

	const handleOk = () => {
		emit(draft)
		setOpen(false)
		setKeyword('')
	}

	const handleCancel = () => {
		setDraft(toValueArray(value))
		setOpen(false)
		setKeyword('')
	}

	const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Escape') {
			e.stopPropagation()
			setKeyword('')
		}
	}

	// 触发区：已选标签摘要（基于外部 value 回显），只展示中文名，完整内容放 tooltip
	const selectedLabels = useMemo(() => {
		const map = new Map(options.map((o) => [o.value, o.label]))
		return toValueArray(value).map((v) => parseLabel(map.get(v) || v))
	}, [value, options])

	const trigger = (
		<div className={styles.trigger} onClick={() => setOpen(true)}>
			{selectedLabels.length === 0 ? (
				<span className={styles.placeholder}>{placeholder || `请选择${label}`}</span>
			) : (
				<>
					<span className={styles.triggerTags}>
						{selectedLabels.slice(0, 2).map((item, i) => (
							<Tag key={i} bordered={false} className={styles.chip} title={item.raw}>
								{item.name}
							</Tag>
						))}
					</span>
					{selectedLabels.length > 2 && <span className={styles.more}>+{selectedLabels.length - 2}</span>}
				</>
			)}
			<span className={styles.suffix}>
				<DownOutlined />
			</span>
		</div>
	)

	return (
		<>
			{trigger}

			<Modal
				open={open}
				onCancel={handleCancel}
				onOk={handleOk}
				width={860}
				centered
				destroyOnHidden
				maskClosable={false}
				title={
					<div className={styles.modalTitle}>
						<CheckCircleFilled className={styles.modalIcon} />
						<div>
							<div className={styles.modalTitleMain}>{`配置${label}`}</div>
							<div className={styles.modalTitleSub}>按分组勾选，确认后回写表单</div>
						</div>
					</div>
				}
				className={styles.modal}
				footer={
					<div className={styles.footer}>
						<div className={styles.footerLeft}>
							<span className={styles.footerCount}>
								已选 <strong>{draft.length}</strong> / {options.length} 项
							</span>
							{draft.length > 0 && (
								<Button type="link" size="small" onClick={() => setDraft([])}>
									清空
								</Button>
							)}
						</div>
						<div className={styles.footerRight}>
							<Button onClick={handleCancel}>取消</Button>
							<Button type="primary" onClick={handleOk}>
								确认
							</Button>
						</div>
					</div>
				}
			>
				<div className={styles.toolbar}>
					<Input
						allowClear
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						onKeyDown={handleSearchKeyDown}
						prefix={<SearchOutlined className={styles.searchIcon} />}
						placeholder={`搜索${label}或分组名称`}
					/>
				</div>

				<div className={styles.meta}>
					<Checkbox
						checked={allVisibleSelected}
						indeterminate={someVisibleSelected && !allVisibleSelected}
						onChange={(e) => toggleCodes(visibleCodes, e.target.checked)}
					>
						全选{normalizedKeyword ? '当前结果' : `所有${label}`}
					</Checkbox>
					<span className={styles.metaCount}>
						{normalizedKeyword ? `筛选出 ${visibleCodes.length} 项` : `${filteredGroups.length} 个分组 · ${options.length} 项`}
					</span>
				</div>

				<div className={styles.body} ref={bodyRef}>
					{filteredGroups.length === 0 ? (
						<div className={styles.emptyWrap}>
							<Empty
								image={Empty.PRESENTED_IMAGE_SIMPLE}
								description={
									<div>
										<div className={styles.emptyTitle}>没有找到匹配「{keyword.trim()}」的{label}</div>
										<div className={styles.emptySub}>试试搜索名称或分组名称</div>
									</div>
								}
							>
								<Button size="small" icon={<ReloadOutlined />} onClick={() => setKeyword('')}>
									清空搜索
								</Button>
							</Empty>
						</div>
					) : (
						filteredGroups.map(({ group, options: points }) => {
							const groupSelected = points.filter((o) => selectedSet.has(o.value)).length
							const groupChecked = points.every((o) => selectedSet.has(o.value))
							const groupIndeterminate = points.some((o) => selectedSet.has(o.value)) && !groupChecked
							const isCollapsed = collapsed.includes(group) && !normalizedKeyword

							return (
								<section className={styles.group} key={group}>
									<header className={styles.groupHead}>
										<button
											type="button"
											className={styles.collapseBtn}
											onClick={() => toggleCollapse(group)}
										>
											{isCollapsed ? <RightOutlined /> : <DownOutlined />}
										</button>
										<Checkbox
											checked={groupChecked}
											indeterminate={groupIndeterminate}
											onChange={(e) => toggleCodes(points.map((o) => o.value), e.target.checked)}
										/>
										<span className={styles.groupName}>{highlight(group)}</span>
										<span className={`${styles.groupCount} ${groupSelected ? styles.groupCountActive : ''}`}>
											{groupSelected}/{points.length}
										</span>
									</header>

									{!isCollapsed && (
										<div className={styles.points}>
											{points.map((o) => {
												const checked = selectedSet.has(o.value)
												const parsed = parseLabel(o.label)
												return (
													<Checkbox
														key={o.value}
														className={`${styles.point} ${checked ? styles.pointChecked : ''}`}
														checked={checked}
														onChange={() => togglePoint(o.value)}
													>
														<span title={parsed.code ? `${parsed.name}（${parsed.code}）` : parsed.raw}>
															{highlight(parsed.name)}
														</span>
													</Checkbox>
												)
											})}
										</div>
									)}
								</section>
							)
						})
					)}
				</div>
			</Modal>
		</>
	)
})

interface IProps extends Component.PropsEditComponent {
	valueFormat?: 'csv'
	placeholder?: string
	/** 自定义字段名称，用于弹窗标题等文案；缺省取表单字段的 __name */
	fieldName?: string
	[x: string]: any
}

const Index = (props: IProps) => {
	const { __bind, __name, itemProps, valueFormat, placeholder, ...rest_props } = props
	const [x] = useState(() => container.resolve(Model))

	useLayoutEffect(() => {
		x.remote.raw_props = props
		x.remote.init()
	}, [props])

	const options = useMemo<GroupedOption[]>(() => (x.options || []) as GroupedOption[], [x.options])

	return (
		<Item className={styles._local} {...itemProps} {...{ __bind, __name }}>
			<Custom
				options={options}
				valueFormat={valueFormat}
				placeholder={placeholder}
				fieldName={props.fieldName || __name}
			/>
		</Item>
	)
}

export default new window.$app.Handle(Index).by(observer).by(window.$app.memo).get()
