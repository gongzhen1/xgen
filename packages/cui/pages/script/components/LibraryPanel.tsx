import { useEffect, useMemo, useState } from 'react'
import { Modal, Empty, Spin, message } from 'antd'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import styles from './LibraryPanel.less'

/**
 * 组件组条目：由接口按 library 连接器下文件的「分组」聚合而来，
 * files 为该组件组的实质文件（清单 json 已展开，按加载顺序）；多文件时 type='bundle'。
 */
export interface LibraryFile {
	name: string
	label?: string
	/** 组件名称：所属组件包的显示名（组件包清单取自身 label，普通文件取引用它的组件包） */
	component?: string
	type?: 'file' | 'bundle'
	content_type?: string
	bytes?: number
	size?: string
	created_at?: string
	url?: string
	count?: number
	files?: string[]
	missing?: string[]
}

/** 已选条目：组件包显示 label（N 个文件），可展开看明细 */
interface SortableItemProps {
	name: string
	index: number
	file?: LibraryFile
	expanded: boolean
	onToggle: (name: string) => void
	onRemove: (name: string) => void
}

const SortableItem = ({ name, index, file, expanded, onToggle, onRemove }: SortableItemProps) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: name })
	const isBundle = file?.type === 'bundle'
	const missing = file?.missing || []

	return (
		<div
			ref={setNodeRef}
			className={[styles.item, isDragging ? styles.dragging : ''].filter(Boolean).join(' ')}
			style={{ transform: CSS.Transform.toString(transform), transition }}
		>
			<div className={styles.row}>
				<span className={styles.handle} {...attributes} {...listeners}>
					<svg width='10' height='14' viewBox='0 0 10 14' fill='currentColor'>
						<circle cx='2.5' cy='2.5' r='1.4' />
						<circle cx='7.5' cy='2.5' r='1.4' />
						<circle cx='2.5' cy='7' r='1.4' />
						<circle cx='7.5' cy='7' r='1.4' />
						<circle cx='2.5' cy='11.5' r='1.4' />
						<circle cx='7.5' cy='11.5' r='1.4' />
					</svg>
				</span>
				<span className={styles.order}>{index + 1}</span>
				<span className={styles.name} title={[name].concat(file?.files || []).join('\n')}>
					{file?.label || name}
					{isBundle ? <span className={styles.badge}>{file?.count} 个文件</span> : null}
				</span>
				{file?.label && file.label !== name && (
					<span className={styles.component} title={name}>
						{name}
					</span>
				)}
				{!file && <span className={styles.missing}>已不存在</span>}
				{missing.length > 0 && <span className={styles.missing}>缺 {missing.length} 个文件</span>}
				{isBundle && (
					<span className={styles.link} onClick={() => onToggle(name)}>
						{expanded ? '收起' : '明细'}
					</span>
				)}
				<span className={styles.remove} onClick={() => onRemove(name)}>
					移除
				</span>
			</div>
			{isBundle && expanded && (
				<div className={styles.detail}>
					{(file?.files || []).map((f, i) => (
						<div key={f} className={styles.detailRow}>
							<span className={styles.order}>{i + 1}</span>
							<span className={styles.name} title={f}>
								{f}
							</span>
							{missing.includes(f) && <span className={styles.missing}>文件不存在</span>}
						</div>
					))}
				</div>
			)}
		</div>
	)
}

interface IProps {
	open: boolean
	/** 页面名称（页面 ID），如 page_xxx */
	pageName: string
	/** 页面主键，优先按 id 保存 */
	pageId?: string | number
	onClose: () => void
}

/**
 * 页面设置弹窗：配置该页面渲染前自动加载的组件库。
 * 来源为「文件管理 → 组件库」，普通文件与组件包（清单 json）都可勾选；
 * 顺序即加载顺序（改后无需重新发布）。
 */
const LibraryPanel = ({ open, pageName, pageId, onClose }: IProps) => {
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [libraries, setLibraries] = useState<LibraryFile[]>([])
	const [selected, setSelected] = useState<string[]>([])
	const [expanded, setExpanded] = useState<Record<string, boolean>>({})

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

	const load = async () => {
		if (!pageName && !pageId) return
		setLoading(true)
		try {
			const query = new URLSearchParams()
			if (pageName) query.set('name', pageName)
			if (pageId != null && pageId !== '') query.set('id', String(pageId))
			const resp = await fetch(`/api/custompage/libraries?${query.toString()}`)
			if (!resp.ok) throw new Error(`请求失败 (HTTP ${resp.status})`)
			const res = await resp.json()
			const data = res?.data ?? res ?? {}
			setLibraries(Array.isArray(data.libraries) ? data.libraries : [])
			setSelected(Array.isArray(data.selected) ? data.selected : [])
		} catch (err: any) {
			message.error(err?.message || '组件库列表加载失败')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (open) load()
	}, [open, pageName, pageId])

	const fileMap = useMemo(() => {
		const map: Record<string, LibraryFile> = {}
		libraries.forEach((f) => {
			if (f?.name) map[f.name] = f
		})
		return map
	}, [libraries])

	// 可选列表由接口直接返回「组件组」（library 连接器下按分组聚合），
	// 组件内的文件通过「明细」展开，不在列表中逐文件平铺
	const available = useMemo(() => libraries.filter((c) => c?.name && !selected.includes(c.name)), [libraries, selected])

	const add = (name: string) => setSelected((prev) => (prev.includes(name) ? prev : [...prev, name]))
	const remove = (name: string) => setSelected((prev) => prev.filter((n) => n !== name))
	const toggle = (name: string) => setExpanded((prev) => ({ ...prev, [name]: !prev[name] }))

	const onDragEnd = (event: DragEndEvent) => {
		const { active, over } = event
		if (!over || active.id === over.id) return
		setSelected((prev) => {
			const from = prev.indexOf(String(active.id))
			const to = prev.indexOf(String(over.id))
			if (from < 0 || to < 0) return prev
			return arrayMove(prev, from, to)
		})
	}

	const save = async () => {
		if (!pageName && !pageId) {
			message.error('缺少页面标识，无法保存')
			return
		}
		setSaving(true)
		try {
			const resp = await fetch('/api/custompage/libraries', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: pageId, name: pageName, libraries: selected })
			})
			if (!resp.ok) {
				let msg = `请求失败 (HTTP ${resp.status})`
				try {
					const data = await resp.json()
					if (data?.message) msg = String(data.message)
				} catch {
					/* 忽略非 JSON 响应 */
				}
				throw new Error(msg)
			}
			message.success('组件库已保存，刷新预览即可生效')
			onClose()
		} catch (err: any) {
			message.error(err?.message || '保存失败')
		} finally {
			setSaving(false)
		}
	}

	return (
		<Modal
			open={open}
			title='页面设置'
			width={960}
			onCancel={onClose}
			onOk={save}
			okText='保存'
			cancelText='取消'
			confirmLoading={saving}
			destroyOnClose
			style={{ top: '8vh' }}
		>
			<div className={styles.tip}>
				组件库文件在「文件管理 → 组件库」中上传；勾选的库会在页面渲染前按顺序自动加载，改库或调顺序无需重新发布。
				列表按组件组展示（library 连接器下按文件「分组」聚合），组内文件点「明细」查看。
			</div>

			<Spin spinning={loading}>
				<div className={styles.body}>
					<div className={styles.col}>
						<div className={styles.colHeader}>
							<span>可选组件库</span>
							<span className={styles.count}>{available.length}</span>
						</div>
						<div className={styles.list}>
							{available.length === 0 ? (
								<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='暂无可选库' />
							) : (
								available.map((c) => {
									const files = c.files || []
									const missing = c.missing || []
									const isBundle = c.type === 'bundle'
									return (
										<div key={c.name} className={styles.item}>
											<div className={styles.row}>
												<span className={styles.name} title={files.join('\n')}>
													{c.label || c.name}
													{isBundle ? <span className={styles.badge}>{c.count || files.length} 个文件</span> : null}
												</span>
												{missing.length > 0 && <span className={styles.missing}>缺 {missing.length} 个文件</span>}
												{isBundle && (
													<span className={styles.link} onClick={() => toggle(c.name)}>
														{expanded[c.name] ? '收起' : '明细'}
													</span>
												)}
												<span className={styles.link} onClick={() => add(c.name)}>
													添加
												</span>
											</div>
											{isBundle && expanded[c.name] && (
												<div className={styles.detail}>
													{files.map((f, i) => (
														<div key={f} className={styles.detailRow}>
															<span className={styles.order}>{i + 1}</span>
															<span className={styles.name} title={f}>
																{f}
															</span>
															{missing.includes(f) && <span className={styles.missing}>文件不存在</span>}
														</div>
													))}
												</div>
											)}
										</div>
									)
								})
							)}
						</div>
					</div>

					<div className={styles.col}>
						<div className={styles.colHeader}>
							<span>已选（按加载顺序）</span>
							<span className={styles.count}>{selected.length}</span>
						</div>
						<div className={styles.list}>
							{selected.length === 0 ? (
								<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='尚未选择组件库' />
							) : (
								<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
									<SortableContext items={selected} strategy={verticalListSortingStrategy}>
										{selected.map((name, index) => (
											<SortableItem
												key={name}
												name={name}
												index={index}
												file={fileMap[name]}
												expanded={!!expanded[name]}
												onToggle={toggle}
												onRemove={remove}
											/>
										))}
									</SortableContext>
								</DndContext>
							)}
						</div>
					</div>
				</div>
			</Spin>
		</Modal>
	)
}

export default LibraryPanel
