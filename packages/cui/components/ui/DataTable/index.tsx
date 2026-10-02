import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
	Input,
	Select,
	Button,
	Space,
	Typography,
	Tooltip,
	Empty,
	Spin,
	Checkbox,
	Popover,
	InputNumber,
	DatePicker,
	Pagination
} from 'antd'
import dayjs from 'dayjs'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import ActionButton from '../ActionButton'
import {
	DataTableProps,
	TableColumn,
	DEFAULT_COLUMN_WIDTHS,
	ColumnWidthConfig,
	ColumnFilterValue
} from './types'
import styles from './index.less'

const { Option } = Select
const { Text } = Typography

// 选择列固定 key
const SELECTION_KEY = '__selection__'

function DataTable<T extends Record<string, any>>({
	data,
	columns,
	loading = false,
	loadingMore = false,
	hasMore = false,
	onLoadMore,
	total,
	filters,
	searchPlaceholder,
	onSearch,
	extraActions,
	actions = [],
	emptyText,
	size = 'middle',
	columnWidths,
	columnWidthPreset = 'normal',
	autoFitColumns = false,
	rowKey,
	rowSelection,
	sort,
	onSortChange,
	columnFilters,
	onColumnFilter,
	onCellSave,
	pagination
}: DataTableProps<T>) {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 将 null 转换为空数组，空值是正常的业务状态
	const safeData = data ?? []

	// 获取行的唯一key
	const getRowKey = (record: T, index: number): string => {
		if (typeof rowKey === 'function') {
			return rowKey(record, index)
		}
		if (typeof rowKey === 'string') {
			return record[rowKey] || `row-${index}`
		}
		// 默认使用 id 字段，如果没有则使用索引
		return record.id || `row-${index}`
	}

	const [searchValue, setSearchValue] = useState('')
	const [filterValues, setFilterValues] = useState<Record<string, any>>({})
	const tableRef = useRef<HTMLDivElement>(null)
	const tableBodyRef = useRef<HTMLDivElement>(null)
	const tableHeaderRef = useRef<HTMLDivElement>(null)

	// 单元格编辑状态
	const [editingCell, setEditingCell] = useState<{ rowKey: string; dataIndex: string } | null>(null)
	const [editingValue, setEditingValue] = useState<any>('')
	const cancelEditRef = useRef(false)

	// 表体可视宽度：autoFitColumns 时按它把列宽补足到铺满容器。
	// 以表体客户区宽度为准（而非表头），这样表头与表体拿到完全相同的列宽，不会出现列错位。
	const [fitWidth, setFitWidth] = useState(0)
	useEffect(() => {
		if (!autoFitColumns) return
		const el = tableBodyRef.current
		if (!el) return
		const update = () => setFitWidth(el.clientWidth)
		update()
		const ro = new ResizeObserver(update)
		ro.observe(el)
		return () => ro.disconnect()
	}, [autoFitColumns])

	// 合并列宽配置
	const columnWidthConfig = useMemo((): ColumnWidthConfig => {
		const preset = DEFAULT_COLUMN_WIDTHS[columnWidthPreset] || DEFAULT_COLUMN_WIDTHS.normal
		return { ...preset, ...columnWidths }
	}, [columnWidthPreset, columnWidths])

	// ===================== 行勾选 =====================
	const selectedKeySet = useMemo(() => new Set(rowSelection?.selectedRowKeys || []), [rowSelection?.selectedRowKeys])
	const allRowKeys = useMemo(() => safeData.map((r, i) => getRowKey(r, i)), [safeData, rowKey])
	const allChecked = allRowKeys.length > 0 && allRowKeys.every((k) => selectedKeySet.has(k))
	const someChecked = allRowKeys.some((k) => selectedKeySet.has(k))

	const emitSelection = (keys: React.Key[]) => {
		rowSelection?.onChange?.(keys, safeData.filter((r, i) => keys.includes(getRowKey(r, i))))
	}

	const handleToggleAll = () => {
		emitSelection(allChecked ? [] : allRowKeys)
	}

	const handleToggleRow = (key: string) => {
		const current = rowSelection?.selectedRowKeys || []
		emitSelection(selectedKeySet.has(key) ? current.filter((k) => k !== key) : [...current, key])
	}

	// ===================== 排序 =====================
	const handleSortClick = (column: TableColumn<T>) => {
		if (!onSortChange) return
		const next = sort?.key === column.key ? (sort.order === 'asc' ? 'desc' : null) : 'asc'
		onSortChange(column.key, next)
	}

	// ===================== 表头漏斗筛选 =====================
	const hasFilterValue = (v?: ColumnFilterValue): boolean => {
		if (!v) return false
		if (v.type === 'text') return !!v.value
		if (v.type === 'set') return (v.values || []).length > 0
		return v.min !== null && v.min !== undefined || v.max !== null && v.max !== undefined
	}

	const commitFilter = (key: string, value: ColumnFilterValue | null) => {
		onColumnFilter?.(key, value)
	}

	const renderFilterPanel = (column: TableColumn<T>) => {
		const cfg = column.filter
		if (!cfg) return null
		const value = columnFilters?.[column.key]

		// 多选面板
		if (cfg.type === 'set') {
			const values: string[] = value && value.type === 'set' ? value.values : []
			// 选项兼容字符串（值即文本）与 {label,value}
			const normOptions = (cfg.options || []).map((opt: any) =>
				typeof opt === 'object' && opt !== null ? { label: opt.label, value: String(opt.value) } : { label: String(opt), value: String(opt) }
			)
			return (
				<div className='dt-filter-panel'>
					<div className='dt-filter-head'>{is_cn ? `筛选 ${column.title}` : `Filter ${column.title}`}</div>
					<div className='dt-filter-list'>
						{normOptions.map((opt) => (
							<Checkbox
								key={opt.value}
								checked={values.includes(opt.value)}
								onChange={(e) => {
									const next = e.target.checked ? [...values, opt.value] : values.filter((v) => v !== opt.value)
									commitFilter(column.key, next.length ? { type: 'set', values: next } : null)
								}}
							>
								{opt.label}
							</Checkbox>
						))}
					</div>
					<div className='dt-filter-foot'>
						<Button type='link' size='small' style={{ padding: 0 }} onClick={() => commitFilter(column.key, null)}>
							{is_cn ? '清除' : 'Clear'}
						</Button>
					</div>
				</div>
			)
		}

		// 区间面板
		if (cfg.type === 'range') {
			const min = value && value.type === 'range' ? value.min : null
			const max = value && value.type === 'range' ? value.max : null
			const commit = (mn: number | null, mx: number | null) => {
				commitFilter(column.key, mn === null && mx === null ? null : { type: 'range', min: mn, max: mx })
			}
			return (
				<div className='dt-filter-panel'>
					<div className='dt-filter-head'>{is_cn ? `筛选 ${column.title}` : `Filter ${column.title}`}</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
						<InputNumber
							size='small'
							placeholder={is_cn ? '最小值' : 'Min'}
							value={min ?? undefined}
							onChange={(v) => commit(v === undefined ? null : Number(v), max)}
							style={{ width: '100%' }}
						/>
						<span>—</span>
						<InputNumber
							size='small'
							placeholder={is_cn ? '最大值' : 'Max'}
							value={max ?? undefined}
							onChange={(v) => commit(min, v === undefined ? null : Number(v))}
							style={{ width: '100%' }}
						/>
					</div>
					<div className='dt-filter-foot'>
						<Button type='link' size='small' style={{ padding: 0 }} onClick={() => commitFilter(column.key, null)}>
							{is_cn ? '清除' : 'Clear'}
						</Button>
					</div>
				</div>
			)
		}

		// 文本面板
		return (
			<div className='dt-filter-panel'>
				<div className='dt-filter-head'>{is_cn ? `筛选 ${column.title}` : `Filter ${column.title}`}</div>
				<Input
					size='small'
					allowClear
					placeholder={cfg.placeholder || (is_cn ? '包含关键字' : 'Contains')}
					defaultValue={value && value.type === 'text' ? value.value : ''}
					onChange={(e) => commitFilter(column.key, e.target.value.trim() ? { type: 'text', value: e.target.value.trim() } : null)}
				/>
			</div>
		)
	}

	// ===================== 单元格编辑 =====================
	const startEdit = (record: T, column: TableColumn<T>, index: number) => {
		if (!column.editable || !onCellSave) return
		cancelEditRef.current = false
		setEditingCell({ rowKey: getRowKey(record, index), dataIndex: column.dataIndex })
		setEditingValue(record[column.dataIndex])
	}

	const finishEdit = (record: T, column: TableColumn<T>) => {
		if (cancelEditRef.current) {
			cancelEditRef.current = false
			setEditingCell(null)
			return
		}
		let value = editingValue
		if (column.editable?.type === 'number') {
			value = Math.max(0, Number(String(value).replace(/[^\d.-]/g, '')) || 0)
		} else if (typeof value === 'string') {
			value = value.trim()
		}
		onCellSave?.(record, column.dataIndex, value)
		setEditingCell(null)
	}

	const cancelEdit = () => {
		cancelEditRef.current = true
		setEditingCell(null)
	}

	const renderCellEditor = (column: TableColumn<T>, record: T) => {
		const type = column.editable?.type
		const common = {
			size: 'small' as const,
			variant: 'borderless' as const, // antd6 无边框变体：从组件层面去掉边框和阴影
			autoFocus: true,
			style: { width: '100%', height: 30 }, // 行内样式兜底：与行高一致
			onBlur: () => finishEdit(record, column),
			onKeyDown: (e: any) => {
				if (e.key === 'Escape') cancelEdit()
			}
		}
		// antd6 Select 不支持 onPressEnter（会告警 Unknown event handler property），仅 Input/InputNumber 使用
		const withEnter = { ...common, onPressEnter: (e: any) => e?.target?.blur?.() }
		if (type === 'datetime') {
			const fmt = column.editable?.format || 'YYYY-MM-DD HH:mm'
			const parsed = editingValue ? dayjs(editingValue) : null
			return (
				<DatePicker
					size='small'
					variant='borderless'
					allowClear={false}
					open // 点击单元格即展开日期时间面板；选完 onChange 保存并卸载
					showTime={{ format: 'HH:mm' }}
					format={fmt}
					style={{ width: '100%', height: 30 }}
					value={parsed && parsed.isValid() ? parsed : null}
					onChange={(val) => {
						const str = val ? val.format(fmt) : null
						cancelEditRef.current = false
						onCellSave?.(record, column.dataIndex, str)
						setEditingCell(null)
					}}
					onOpenChange={(o) => {
						// 点外部关闭 / 确定按钮（onChange 已先保存）→ 取消编辑态
						if (!o) cancelEdit()
					}}
					onKeyDown={(e: any) => {
						if (e.key === 'Escape') cancelEdit()
					}}
				/>
			)
		}
		if (type === 'select') {
			return (
				<Select
					{...common}
					value={editingValue}
					options={column.editable?.options || []}
					onChange={(v) => {
						cancelEditRef.current = false
						onCellSave?.(record, column.dataIndex, v)
						setEditingCell(null)
					}}
					onOpenChange={(open) => {
						if (!open) cancelEdit()
					}}
				/>
			)
		}
		if (type === 'number') {
			return (
				<InputNumber
					{...withEnter}
					min={0}
					value={editingValue}
					onChange={(v) => setEditingValue(v)}
				/>
			)
		}
		return (
			<Input
				{...withEnter}
				value={editingValue}
				onChange={(e) => setEditingValue(e.target.value)}
			/>
		)
	}

	// 应用列宽配置到列定义，并自动分配剩余宽度
	const enhancedColumns = useMemo(() => {
		const cols: any[] = []

		// 勾选列
		if (rowSelection) {
			const selectionWidthConfig = columnWidthConfig[SELECTION_KEY]
			cols.push({
				key: SELECTION_KEY,
				title: '',
				dataIndex: SELECTION_KEY,
				width: selectionWidthConfig?.width ?? 40,
				align: 'center' as const,
				selection: true
			})
		}

		columns.forEach((col) => {
			const widthConfig = columnWidthConfig[col.key as keyof ColumnWidthConfig]
			cols.push({
				...col,
				width: col.width || widthConfig?.width,
				minWidth: col.minWidth || widthConfig?.minWidth,
				maxWidth: col.maxWidth || widthConfig?.maxWidth,
				flex: col.flex || widthConfig?.flex
			})
		})

		// 添加操作列
		if (actions.length > 0) {
			const actionsWidthConfig = columnWidthConfig.actions
			cols.push({
				key: 'actions',
				title: is_cn ? '操作' : 'Actions',
				dataIndex: 'actions',
				width: actionsWidthConfig?.width ?? Math.max(80, actions.length * 40),
				minWidth: actionsWidthConfig?.minWidth,
				maxWidth: actionsWidthConfig?.maxWidth,
				flex: actionsWidthConfig?.flex,
				align: 'center' as const,
				render: (_: any, record: T, index: number) => (
					<div className={styles.actionsCell}>
						<Space size='small'>
							{actions
								.filter((action) => (action.visible ? action.visible(record) : true))
								.map((action) => (
									<ActionButton
										key={action.key}
										icon={action.icon}
										iconSize={14}
										title={action.label}
										disabled={action.disabled ? action.disabled(record) : false}
										onClick={() => action.onClick?.(record, index)}
										danger={action.key === 'delete'}
									/>
								))}
						</Space>
					</div>
				)
			})
		}

		// 自动分配宽度：如果有列没有设置宽度，给它们分配剩余空间
		const flexColumns = cols.filter((col) => !col.width)
		if (flexColumns.length > 0) {
			flexColumns.forEach((col) => {
				col.flex = col.flex || 1
			})
		}

		// autoFitColumns：所有列都有固定宽度且总宽小于容器时，按比例把剩余宽度补给各列，
		// 避免列全部挤在左侧、右侧留一大片空白。溢出的情况（总宽 > 容器）不处理，保持横向滚动。
		if (autoFitColumns && fitWidth > 0 && cols.every((col) => col.width)) {
			// 单元格 CSS min-width 为 60px，低于它的列会被撑到 60px，这里先对齐，避免补宽后溢出
			const bases = cols.map((col) => Math.max(Number(col.width) || 0, Number(col.minWidth) || 0, 60))
			const total = bases.reduce((a, b) => a + b, 0)
			if (fitWidth > total) {
				const extra = fitWidth - total
				let used = 0
				cols.forEach((col, i) => {
					const base = bases[i]
					// 最后一列吃掉累计取整误差，保证列宽总和精确等于容器宽度
					const share = i === cols.length - 1 ? extra - used : Math.round((extra * base) / total)
					used += share
					col.width = Math.min(base + share, Number(col.maxWidth) || Infinity)
				})
			}
		}

		return cols
	}, [columns, actions, columnWidthConfig, is_cn, rowSelection, autoFitColumns, fitWidth])

	// 使用 Intersection Observer 监听最后一行的可见性
	useEffect(() => {
		if (!hasMore || !onLoadMore || loadingMore || safeData.length === 0) return

		let observer: IntersectionObserver | null = null

		// 延迟查找表格容器，确保DOM已渲染
		const timer = setTimeout(() => {
			const tableBody = tableBodyRef.current
			if (!tableBody) return

			// 获取所有表格行
			const allRows = tableBody.querySelectorAll(`.${styles.tableRow}`)

			// 获取最后一行
			const lastRow = allRows[allRows.length - 1]
			if (!lastRow || allRows.length === 0) {
				return
			}

			// 创建 Intersection Observer
			observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						// 当最后一行进入视口时触发加载
						if (entry.isIntersecting && !loadingMore) {
							onLoadMore()
						}
					})
				},
				{
					root: tableBody, // 使用表格体作为观察根元素
					rootMargin: '50px', // 提前50px触发加载
					threshold: 0 // 只要有一点点可见就触发
				}
			)

			observer.observe(lastRow)
		}, 100)

		return () => {
			clearTimeout(timer)
			if (observer) {
				observer.disconnect()
			}
		}
	}, [hasMore, onLoadMore, loadingMore, safeData.length])

	// 同步表头和表体的横向滚动
	useEffect(() => {
		const tableBody = tableBodyRef.current
		const tableHeader = tableHeaderRef.current

		if (!tableBody || !tableHeader) return

		const handleScroll = (event: Event) => {
			const scrollLeft = (event.target as HTMLElement).scrollLeft

			// 尝试直接设置scrollLeft
			tableHeader.scrollLeft = scrollLeft
			const newScrollLeft = tableHeader.scrollLeft

			// 如果scrollLeft无效，使用transform方法
			if (newScrollLeft === 0 && scrollLeft > 0) {
				tableHeader.style.transform = `translateX(-${scrollLeft}px)`
			} else {
				tableHeader.style.transform = ''
			}
		}

		tableBody.addEventListener('scroll', handleScroll)

		return () => {
			tableBody.removeEventListener('scroll', handleScroll)
		}
	}, [safeData.length])

	// ===================== 表头单元格 =====================
	const renderHeaderContent = (column: any) => {
		if (column.selection) {
			return (
				<Checkbox
					checked={allChecked}
					indeterminate={!allChecked && someChecked}
					onChange={handleToggleAll}
				/>
			)
		}

		const sortActive = sort?.key === column.key
		const filterActive = hasFilterValue(columnFilters?.[column.key])

		return (
			<>
				<span className={styles.headerTitle}>{column.title}</span>
				{column.sorter && (
					<Tooltip title={sortActive ? (sort?.order === 'asc' ? '降序' : '取消排序') : '升序'}>
						<button
							type='button'
							className={sortActive ? styles.sortBtnActive : styles.sortBtn}
							onClick={() => handleSortClick(column)}
						>
							<Icon
								name={
									sortActive
										? sort?.order === 'asc'
											? 'material-arrow_upward'
											: 'material-arrow_downward'
										: 'material-swap_vert'
								}
								size={12}
							/>
						</button>
					</Tooltip>
				)}
				{column.filter && (
					<Popover
						content={renderFilterPanel(column)}
						trigger='click'
						placement='bottomLeft'
						arrow={{ pointAtCenter: true }}
					>
						<button
							type='button'
							className={filterActive ? styles.filterBtnActive : styles.filterBtn}
							onClick={(e) => e.stopPropagation()}
						>
							<Icon name='material-filter_list' size={12} />
							{filterActive && <span className={styles.filterCount}>1</span>}
						</button>
					</Popover>
				)}
			</>
		)
	}

	// 渲染表格单元格内容
	const renderCellContent = useCallback(
		(column: any, record: T, index: number) => {
			if (column.selection) {
				const key = getRowKey(record, index)
				// 与表头勾选列保持同一套居中容器，否则 flex 默认 flex-start 会靠左
				return (
					<div className={styles.selectCellInner}>
						<Checkbox
							checked={selectedKeySet.has(key)}
							onChange={() => handleToggleRow(key)}
						/>
					</div>
				)
			}

			const editing =
				column.editable &&
				onCellSave &&
				editingCell &&
				editingCell.rowKey === getRowKey(record, index) &&
				editingCell.dataIndex === column.dataIndex

			if (editing) {
				return (
					<div className={styles.editingWrap}>{renderCellEditor(column, record)}</div>
				)
			}

			if (column.editable && onCellSave) {
				const raw = column.render
					? column.render(record[column.dataIndex], record, index)
					: record[column.dataIndex]
				return (
					<div
						className={styles.editableCell}
						onClick={(e) => {
							e.stopPropagation()
							startEdit(record, column, index)
						}}
					>
						{raw}
					</div>
				)
			}

			if (column.render) {
				return column.render(record[column.dataIndex], record, index)
			}
			return record[column.dataIndex]
		},
		[editingCell, editingValue, selectedKeySet, onCellSave]
	)

	// 处理搜索
	const handleSearch = (value: string) => {
		setSearchValue(value)
		onSearch?.(value)
	}

	// 处理筛选
	const handleFilterChange = (key: string, value: any) => {
		setFilterValues((prev) => ({ ...prev, [key]: value }))
	}

	// 渲染筛选器
	const renderFilters = () => {
		if (!filters || filters.length === 0) return null

		return (
			<div className={styles.filtersContainer}>
				<div className={styles.filtersLeft}>
					{searchPlaceholder && (
						<Input
							placeholder={searchPlaceholder}
							value={searchValue}
							onChange={(e) => setSearchValue(e.target.value)}
							onPressEnter={() => handleSearch(searchValue)}
							style={{ width: 200 }}
							allowClear
						/>
					)}
					{filters.map((filter) => (
						<div key={filter.key} className={styles.filterItem}>
							{filter.type === 'select' && (
								<Select
									placeholder={filter.label}
									value={filterValues[filter.key]}
									onChange={(value) => {
										handleFilterChange(filter.key, value)
										filter.onChange?.(value)
									}}
									style={{ width: 140 }}
									allowClear
								>
									{filter.options?.map((option) => (
										<Option key={option.value} value={option.value}>
											{option.label}
										</Option>
									))}
								</Select>
							)}
							{filter.type === 'search' && (
								<Input
									placeholder={filter.placeholder || filter.label}
									value={filterValues[filter.key]}
									onChange={(e) => handleFilterChange(filter.key, e.target.value)}
									style={{ width: 150 }}
									allowClear
								/>
							)}
						</div>
					))}
					{searchPlaceholder && (
						<Button
							type='primary'
							onClick={() => handleSearch(searchValue)}
							className={styles.searchButton}
						>
							{is_cn ? '搜索' : 'Search'}
						</Button>
					)}
				</div>
				<div className={styles.filtersRight}>
					{extraActions && <div className={styles.extraActions}>{extraActions}</div>}
					<Text type='secondary' className={styles.totalText}>
						{is_cn
							? `共 ${total || safeData.length} 条`
							: `Total ${total || safeData.length} items`}
					</Text>
				</div>
			</div>
		)
	}

	// 自定义空状态
	const customEmpty = emptyText || (
		<Empty
			image={<Icon name='material-inbox' size={48} />}
			description={<Text type='secondary'>{is_cn ? '暂无数据' : 'No data available'}</Text>}
		/>
	)

	if (loading && safeData.length === 0) {
		return (
			<div className={styles.dataTableContainer}>
				{renderFilters()}
				<div className={styles.loadingContainer}>
					<Icon name='material-hourglass_empty' size={32} />
					<Text type='secondary'>{is_cn ? '加载中...' : 'Loading...'}</Text>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.dataTableContainer} ref={tableRef}>
			{renderFilters()}
			<div className={`${styles.customTable} ${size === 'small' ? styles.compact : size === 'large' ? styles.large : ''}`}>
				{/* 表头 */}
				<div className={styles.tableHeader} ref={tableHeaderRef}>
					{enhancedColumns.map((column) => (
						<div
							key={column.key}
							className={styles.headerCell}
							style={{
								width: column.width,
								minWidth: column.minWidth,
								maxWidth: column.maxWidth,
								flex: column.flex,
								textAlign: column.align || 'left',
								justifyContent:
									column.align === 'right' ? 'flex-end' : column.align === 'center' ? 'center' : 'flex-start'
							}}
						>
							{column.selection ? (
								<div className={styles.selectCellInner}>{renderHeaderContent(column)}</div>
							) : (
								renderHeaderContent(column)
							)}
						</div>
					))}
				</div>

				{/* 表体 */}
				<div className={styles.tableBody} ref={tableBodyRef}>
					{safeData.length === 0 ? (
						<div className={styles.emptyContainer}>{customEmpty}</div>
					) : (
						safeData.map((record, rowIndex) => {
							const key = getRowKey(record, rowIndex)
							return (
								<div
									key={key}
									className={`${styles.tableRow} ${selectedKeySet.has(key) ? styles.rowSelected : ''}`}
								>
									{enhancedColumns.map((column) => (
										<div
											key={column.key}
											className={styles.bodyCell}
											style={{
												width: column.width,
												minWidth: column.minWidth,
												maxWidth: column.maxWidth,
												flex: column.flex,
												textAlign: column.align || 'left'
											}}
										>
											{renderCellContent(column, record, rowIndex)}
										</div>
									))}
								</div>
							)
						})
					)}

					{/* 加载更多指示器 */}
					{loadingMore && (
						<div className={styles.loadingMore}>
							<Spin size='small' />
							<Text type='secondary' style={{ marginLeft: 8 }}>
								{is_cn ? '加载更多...' : 'Loading more...'}
							</Text>
						</div>
					)}
				</div>

				{/* 内置分页 */}
				{pagination && (
					<div className={styles.tableFooter}>
						<Pagination
							size='small'
							current={pagination.current}
							pageSize={pagination.pageSize}
							total={pagination.total}
							showSizeChanger={pagination.showSizeChanger !== false}
							showQuickJumper={pagination.showQuickJumper}
							pageSizeOptions={[10, 20, 50, 1000]}
							showTotal={(t) => (is_cn ? `共 ${t} 条` : `Total ${t}`)}
							onChange={(page, pageSize) => pagination.onChange?.(page, pageSize)}
						/>
					</div>
				)}
			</div>
		</div>
	)
}

export default DataTable
