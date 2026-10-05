import { Button, Form, Select, Transfer, message } from 'antd'
import axios from 'axios'
import clsx from 'clsx'
import { debounce } from 'lodash-es'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Item } from '@/components'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'

import styles from './index.less'

import type { IProps, ICustom, XTransfer } from './types'
import type { TransferProps, TransferDirection } from 'antd'

type DataItem = { key: string; title: string; disabled?: boolean }

type SideState = {
	items: DataItem[]
	page: number
	total: number
	keywords: string
	loading: boolean
}

const initSide: SideState = { items: [], page: 1, total: 0, keywords: '', loading: false }

const norm = (v: any): string[] => (Array.isArray(v) ? v.map((x: any) => String(x)) : [])

const sameArr = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i])

/** 兼容多种响应：
 * 1. axios 原始响应 { data: { data:[], total } }
 * 2. 拦截器已解包 { data:[], total }（注意：不能因 res.data 是数组就按裸数组处理，否则 total 丢失变成本页条数）
 * 3. 裸数组
 */
const parsePayload = (res: any): { items: Array<any>; total: number } => {
	if (res?.data && Array.isArray(res.data.data)) {
		return { items: res.data.data, total: Number(res.data.total) ?? res.data.data.length }
	}
	if (res && Array.isArray(res.data) && typeof res.total === 'number') {
		return { items: res.data, total: Number(res.total) }
	}
	if (Array.isArray(res)) return { items: res, total: res.length }
	if (Array.isArray(res?.data)) return { items: res.data, total: res.data.length }
	return { items: [], total: 0 }
}

const Custom = window.$app.memo((props: ICustom) => {
	const { value, onChange, xProps, __name, disabled } = props
	const init_page_size = xProps?.pageSize || 10

	const form = Form.useFormInstance()
	// 逐个监听 bindParams 指定字段（如 team_id）；注意 hook 数量由配置决定，配置在生命周期内稳定
	const bind_params = xProps?.bindParams || []
	/* eslint-disable react-hooks/rules-of-hooks */
	const bind_values = bind_params.map((k: string) => Form.useWatch(k, form))
	/* eslint-enable react-hooks/rules-of-hooks */
	const form_values: Record<string, any> = {}
	bind_params.forEach((k: string, i: number) => (form_values[k] = bind_values[i]))

	const [leftSide, setLeftSide] = useState<SideState>(initSide)
	const [rightSide, setRightSide] = useState<SideState>(initSide)
	// 两侧各自的每页条数（footer 可切换）
	const [pageSizeMap, setPageSizeMap] = useState<Record<TransferDirection, number>>({
		left: init_page_size,
		right: init_page_size
	})
	const [targetKeys, setTargetKeys] = useState<string[]>([])
	const [lockedKeys, setLockedKeys] = useState<string[]>([])
	// 本次会话中新加入右侧的项（尚未保存），常驻右栏且可移回
	const [pinned, setPinned] = useState<Map<string, DataItem>>(new Map())
	// 历次请求的项缓存，用于取移动项的标题
	const cacheRef = useRef<Map<string, DataItem>>(new Map())
	// 防竞态：过期响应丢弃
	const seq_ref = useRef<Record<TransferDirection, number>>({ left: 0, right: 0 })
	// 最新每页条数（debounce 搜索闭包通过 ref 读取，避免陈旧值）
	const page_size_ref = useRef(pageSizeMap)
	page_size_ref.current = pageSizeMap
	// 标记最近一次由组件自身发出的 value，避免 Form 回写把新增项误锁定
	const emitted_ref = useRef<string[] | null>(null)

	const getSide = (dir: TransferDirection) => (dir === 'left' ? leftSide : rightSide)

	const setSide = (dir: TransferDirection, next: SideState) => {
		if (dir === 'left') setLeftSide(next)
		else setRightSide(next)
	}

	// 外部 value（Find 回填的已加入成员）同步为锁定项
	useEffect(() => {
		const incoming = norm(value)
		if (emitted_ref.current && sameArr(emitted_ref.current, incoming)) return
		emitted_ref.current = incoming
		setLockedKeys(incoming)
		setTargetKeys(incoming)
	}, [value])

	// 从 URL query 取参数作为兜底（如 team_id 可能只在 URL 里，不在 form 字段中）
	const urlParams = useMemo(() => {
		const p = new URLSearchParams(window.location.search)
		const m: Record<string, string> = {}
		p.forEach((v, k) => (m[k] = v))
		return m
	}, [])

	const getBindValue = (k: string) => {
		const v = form_values?.[k]
		if (v !== undefined && v !== null && v !== '') return v
		// 兜底：从 URL query 取，支持 where.team_id.eq 这种键名
		if (urlParams[k] !== undefined && urlParams[k] !== '') return urlParams[k]
		const dotKey = `where.${k}.eq`
		if (urlParams[dotKey] !== undefined && urlParams[dotKey] !== '') return urlParams[dotKey]
		return ''
	}

	const bindReady = () =>
		bind_params.every((k) => {
			const v = getBindValue(k)
			return v !== undefined && v !== null && v !== ''
		})

	const fetchSide = (dir: TransferDirection, page: number, keywords: string, pz?: number) => {
		const cfg: XTransfer.SideApi | undefined = dir === 'left' ? xProps?.left : xProps?.right
		if (!cfg?.remote?.api) return
		if (bind_params.length > 0 && !bindReady()) return

		const page_size = pz || page_size_ref.current[dir]
		const kw = keywords.trim()
		const is_search = kw !== '' && !!cfg.search?.api
		const req = is_search ? cfg.search! : cfg.remote

		const params: Record<string, any> = {
			...(cfg.remote.params || {}),
			...(is_search ? cfg.search!.params || {} : {}),
			page,
			pagesize: page_size
		}
		if (is_search) params[cfg.search!.key || 'keywords'] = kw
		bind_params.forEach((k) => {
			const v = getBindValue(k)
			if (v !== undefined && v !== null && v !== '') params[k] = v
		})

		const seq = ++seq_ref.current[dir]
		setSide(dir, { ...getSide(dir), loading: true })

		axios
			.get(req.api, { params })
			.then((res: any) => {
				if (seq !== seq_ref.current[dir]) return
				const { items: rows, total } = parsePayload(res)
				const items: DataItem[] = rows.map((it: any) => ({
					key: String(it.value),
					title: String(it.label ?? it.value)
				}))
				items.forEach((it) => cacheRef.current.set(it.key, it))
				setSide(dir, { items, page, total, keywords, loading: false })
			})
			.catch((err) => {
				if (seq !== seq_ref.current[dir]) return
				setSide(dir, { ...getSide(dir), loading: false })
				console.error('[Transfer] fetch error', err)
				message.error(`${__name || '选项'}数据加载失败`)
			})
	}

	// bindParams 就绪（或接口变化）时加载两侧第一页
	const bind_key = bind_params.map((k) => form_values?.[k]).join('|')
	useEffect(() => {
		fetchSide('left', 1, '')
		fetchSide('right', 1, '')
	}, [bind_key, xProps?.left?.remote?.api, xProps?.right?.remote?.api])

	const findItem = (key: string): DataItem | undefined =>
		cacheRef.current.get(key) ||
		leftSide.items.find((i) => i.key === key) ||
		rightSide.items.find((i) => i.key === key) ||
		pinned.get(key)

	const handleChange: TransferProps['onChange'] = (keys, direction, moveKeys) => {
		const locked_set = new Set(lockedKeys)
		const next = norm(keys)
		// 防御：已加入成员（锁定项）不允许移回
		const merged = Array.from(new Set([...lockedKeys, ...next]))

		setPinned((prev) => {
			const m = new Map(prev)
			const move = (moveKeys || []).map((k) => String(k))
			if (direction === 'right') {
				move.forEach((k) => {
					if (locked_set.has(k)) return
					const it = findItem(k)
					if (it) m.set(k, { ...it, disabled: false })
				})
			} else {
				move.forEach((k) => {
					if (!locked_set.has(k)) m.delete(k)
				})
			}
			return m
		})

		setTargetKeys(merged)
		emitted_ref.current = merged
		onChange?.(merged)
	}

	const handleSearch = useRef(
		debounce((dir: TransferDirection, kw: string) => fetchSide(dir, 1, kw), 500, { leading: true })
	).current

	useEffect(() => () => handleSearch.cancel(), [handleSearch])

	const dataSource = useMemo(() => {
		const locked_set = new Set(lockedKeys)
		const m = new Map<string, DataItem>()
		leftSide.items.forEach((i) => m.set(i.key, i))
		rightSide.items.forEach((i) => m.set(i.key, i))
		pinned.forEach((v, k) => {
			if (!m.has(k)) m.set(k, v)
		})
		const ds = Array.from(m.values()).map((i) => (locked_set.has(i.key) ? { ...i, disabled: true } : i))
		return ds
	}, [leftSide.items, rightSide.items, pinned, lockedKeys])

	const renderPager = (_: any, info?: { direction: TransferDirection }) => {
		const dir: TransferDirection = info?.direction || 'left'
		const s = dir === 'left' ? leftSide : rightSide
		const pz = pageSizeMap[dir]
		const page_cnt = Math.max(1, Math.ceil((s.total || 0) / pz))
		const changeSize = (size: number) => {
			setPageSizeMap((prev) => ({ ...prev, [dir]: size }))
			// 切换条数后回到第一页重新拉取
			fetchSide(dir, 1, s.keywords, size)
		}
		return (
			<div className={styles.pager}>
				{s.loading ? (
					<span className={styles.loading}>加载中…</span>
				) : (
					<span className={styles.total}>
						共 {s.total} 人{s.total > 0 ? ` · ${s.page}/${page_cnt} 页` : ''}
					</span>
				)}
				{s.total > 0 && (
					<span className={styles.controls}>
						<Select
							size='small'
							className={styles.size_select}
							value={pz}
							options={[10, 20, 50, 100].map((n) => ({ label: `${n} 条/页`, value: n }))}
							onChange={changeSize}
						></Select>
						<Button
							size='small'
							type='text'
							icon={<LeftOutlined></LeftOutlined>}
							disabled={s.page <= 1 || s.loading}
							onClick={() => fetchSide(dir, s.page - 1, s.keywords)}
						></Button>
						<Button
							size='small'
							type='text'
							icon={<RightOutlined></RightOutlined>}
							disabled={s.page >= page_cnt || s.loading}
							onClick={() => fetchSide(dir, s.page + 1, s.keywords)}
						></Button>
					</span>
				)}
			</div>
		)
	}

	// 服务端已对当前页过滤；常驻右侧的本次新增项改由本地匹配
	const filterOption = (input: string, item: DataItem) => {
		if (pinned.has(item.key)) {
			return String(item.title).toLowerCase().indexOf(input.toLowerCase()) >= 0
		}
		return true
	}

	return (
		<Transfer
			className={clsx(styles._local)}
			disabled={disabled}
			dataSource={dataSource}
			targetKeys={targetKeys}
			onChange={handleChange}
			showSearch
			onSearch={handleSearch}
			filterOption={filterOption}
			footer={renderPager}
			titles={['可选用户', '已添加']}
			operations={['加入', '移除']}
			locale={{ searchPlaceholder: '输入关键字搜索', itemUnit: '人', itemsUnit: '人' }}
			listStyle={{ width: 300, height: 340 }}
			render={(item) => item.title as string}
		></Transfer>
	)
})

const Index = (props: IProps) => {
	const { __bind, __name, itemProps, ...rest_props } = props

	return (
		<Item {...itemProps} {...{ __bind, __name }}>
			<Custom {...rest_props} __name={__name}></Custom>
		</Item>
	)
}

export default new window.$app.Handle(Index).by(window.$app.memo).get()
