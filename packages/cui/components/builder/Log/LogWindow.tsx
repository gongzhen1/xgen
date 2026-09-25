import { Tabs, Modal, Select, Input, Switch, Button } from 'antd'
import { getLocale } from '@umijs/max'
import clsx from 'clsx'
import axios from 'axios'
import styles from './index.less'
import type { ILog, LogItem, LogTabItem } from './types'
import { Icon } from '@/widgets'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FormatDateTime } from '@/utils'
import { getApiBase } from '@/services/wellknown'
import { AntdProvider, GlobalProvider } from '@/widgets'
import LogView from './LogView'

interface LogSource {
	type?: string // 'run' | 'debug'
}

interface IProps {
	id: string
	logs: ILog
	title?: string
	tabItems?: LogTabItem[]
	/** 传入 source 时常开远程拉取（事件下拉/时间快捷/刷新），否则只渲染静态 logs */
	source?: LogSource
	onClose: () => void
}

interface LogContentProps {
	logs: ILog
	activeTab: string
	isMaximized?: boolean
}

function unwrapBody(raw: any): ILog {
	return raw?.console ? raw : raw?.data?.console ? raw.data : { console: [] as LogItem[] }
}

function LogContent({ logs, activeTab, isMaximized }: LogContentProps) {
	const is_cn = getLocale() === 'zh-CN'
	const scrollRef = useRef<HTMLDivElement>(null)
	const logEntries = useMemo(() => {
		const raw = logs[activeTab]
		return Array.isArray(raw) ? raw : []
	}, [logs, activeTab])

	const levelIcon = (level: string) => {
		switch (level) {
			case 'trace':
			case 'info':
				return <Icon name='material-info' size={14} />
			case 'debug':
				return <Icon name='material-bug_report' size={14} />
			case 'warn':
				return <Icon name='material-warning' size={14} />
			case 'error':
			case 'fatal':
				return <Icon name='material-dangerous' size={14} />
			default:
				return null
		}
	}

	return (
		<div className={clsx(styles.logContainer, { [styles.maximized]: isMaximized })}>
			<div className={styles.logContent} ref={scrollRef}>
				{logEntries.length ? (
					logEntries.map((item: LogItem, index: number) => (
						<div key={index} className={clsx(styles.logItem, styles[item.level])}>
							<span
								className={styles.datetime}
								style={{ display: item.hideDateTime ? 'none' : '' }}
							>
								{FormatDateTime(new Date(item.datetime), is_cn)}
							</span>
							<span
								className={styles.levelIcon}
								style={{ display: item.hideDateTime ? 'none' : '' }}
							>
								{levelIcon(item.level)}
							</span>
							<span className={clsx(styles.levelBadge, styles[`b_${item.level}`])}>
								{item.level}
							</span>
							<span className={styles.message}>
								<LogView
									{...item}
									className={
										item.level === 'error' || item.level === 'fatal'
											? styles.errorMessage
											: styles.messageContent
									}
								/>
							</span>
						</div>
					))
				) : (
					<div className={styles.emptyLog}>
						<Icon name='material-description' size={24} className={styles.icon} />
						<span>{is_cn ? '暂无日志' : 'No logs available'}</span>
					</div>
				)}
			</div>
			<div className={styles.logScrollBtns}>
				<div
					className={styles.scrollBtn}
					title={is_cn ? '回到底部' : 'Scroll to bottom'}
					onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
				>
					<span className={styles.scrollArrow}>↓</span>
				</div>
				<div
					className={styles.scrollBtn}
					title={is_cn ? '回到顶部' : 'Scroll to top'}
					onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
				>
					<span className={styles.scrollArrow}>↑</span>
				</div>
			</div>
		</div>
	)
}

const LogWindow = (props: IProps) => {
	const [isMaximized, setIsMaximized] = useState(false)
	const is_cn = getLocale() === 'zh-CN'
	const source = props.source
	const [activeTab, setActiveTab] = useState(props.tabItems?.[0]?.key || 'console')
	const tabItems = props.tabItems || [
		{ key: 'console', label: is_cn ? '控制台' : 'Console', children: null },
		{ key: 'request', label: is_cn ? '请求' : 'Request', children: null },
		{ key: 'response', label: is_cn ? '响应' : 'Response', children: null }
	]

	// 远程模式：自身维护数据
	const [logs, setLogs] = useState<ILog>(props.logs)
	const [events, setEvents] = useState<string[]>([])
	const [ips, setIps] = useState<string[]>([])
	const [filters, setFilters] = useState({ range: 5, event: 'all', level: 'all', keyword: '', ip: 'all' })
	const [kwInput, setKwInput] = useState('')
	const [reload, setReload] = useState(0)
	const kwTimer = useRef<any>(null)

	const type = source?.type || 'run'

	const fetchData = async (f = filters) => {
		const params: Record<string, any> = { type, limit: 3000 }
		if (f.range > 0) params.range = f.range
		if (f.event && f.event !== 'all') params.event = f.event
		if (f.level && f.level !== 'all') params.level = f.level
		if (f.keyword && f.keyword.trim()) params.keyword = f.keyword.trim()
		if (f.ip && f.ip !== 'all') params.ip = f.ip
		try {
			const raw: any = await axios.get(`${getApiBase()}/log/view`, { params })
			setLogs(unwrapBody(raw?.data ? raw.data : raw))
		} catch (e) {
			/* ignore */
		}
	}

	// 事件 / 来源 IP 下拉数据
	useEffect(() => {
		if (!source) return
		axios
			.get(`${getApiBase()}/log/events`, { params: { type } })
			.then((raw: any) => {
				const body = raw?.data ? raw.data : raw
				const arr = body?.events || body?.data?.events || []
				const ipArr = body?.ips || body?.data?.ips || []
				setEvents(Array.isArray(arr) ? arr : [])
				setIps(Array.isArray(ipArr) ? ipArr : [])
			})
			.catch(() => {})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [source])

	// 过滤条件变化时重新拉取
	useEffect(() => {
		if (!source) return
		fetchData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filters, reload, source])

	// 自动刷新（默认开启，每 5 秒拉取一次）
	const [autoRefresh, setAutoRefresh] = useState(true)
	useEffect(() => {
		if (!source || !autoRefresh) return
		const timer = setInterval(() => {
			fetchData()
		}, 5000)
		return () => clearInterval(timer)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [autoRefresh, source, filters, reload])

	const onKeyword = (v: string) => {
		setKwInput(v)
		clearTimeout(kwTimer.current)
		kwTimer.current = setTimeout(() => {
			setFilters((f) => ({ ...f, keyword: v }))
		}, 400)
	}

	const rangeOptions = [
		{ value: 0, label: is_cn ? '全部时间' : 'All time' },
		{ value: 5, label: is_cn ? '5 分钟' : '5 min' },
		{ value: 10, label: is_cn ? '10 分钟' : '10 min' },
		{ value: 30, label: is_cn ? '30 分钟' : '30 min' },
		{ value: 60, label: is_cn ? '1 小时' : '1 hour' },
		{ value: 1440, label: is_cn ? '1 天' : '1 day' }
	]

	const levelOptions = [
		{ value: 'all', label: is_cn ? '全部级别' : 'All Levels' },
		{ value: 'trace', label: is_cn ? '追踪' : 'Trace' },
		{ value: 'debug', label: is_cn ? '调试' : 'Debug' },
		{ value: 'info', label: is_cn ? '信息' : 'Info' },
		{ value: 'warn', label: is_cn ? '警告' : 'Warn' },
		{ value: 'error', label: is_cn ? '错误' : 'Error' },
		{ value: 'fatal', label: is_cn ? '致命' : 'Fatal' }
	]

	const eventOptions = [
		{ value: 'all', label: is_cn ? '全部事件' : 'All Events' },
		...events.map((e) => ({ value: e, label: e }))
	]

	const ipOptions = [
		{ value: 'all', label: is_cn ? '全部来源' : 'All Sources' },
		...ips.map((v) => ({ value: v, label: v }))
	]

	return (
		<AntdProvider>
			<GlobalProvider>
				<Modal
					title={
						<div className={styles.modalHeader}>
							<div className={styles.headerTitle}>
								{props.title || (is_cn ? '日志查看器' : 'Log Viewer')}
							</div>
							<div className={styles.headerTabs}>
								<Tabs
									items={tabItems}
									className={styles.logTabs}
									activeKey={activeTab}
									onChange={setActiveTab}
								/>
							</div>
							<div className={styles.headerActions}>
								<Icon
									name={
										isMaximized
											? 'material-fullscreen_exit'
											: 'material-fullscreen'
									}
									className={styles.actionIcon}
									onClick={() => setIsMaximized(!isMaximized)}
									size={16}
								/>
								<Icon
									name='material-close'
									className={styles.actionIcon}
									onClick={props.onClose}
									size={16}
								/>
							</div>
						</div>
					}
					open={true}
					footer={null}
					onCancel={props.onClose}
					width={isMaximized ? '100vw' : 1240}
					className={clsx(styles.logModal, { [styles.maximized]: isMaximized })}
					wrapClassName={isMaximized ? styles.maximizedWrapper : undefined}
					maskClosable={false}
					destroyOnClose
					prefixCls='xgen-modal'
					style={
						isMaximized ? { top: 0, padding: 0, maxWidth: '100vw', margin: 0 } : undefined
					}
					bodyStyle={{
						height: isMaximized ? 'calc(100vh - 55px)' : 'auto',
						padding: '16px'
					}}
				>
					<div className={styles.logToolbarWrap}>
						{source && (
							<div className={styles.logToolbar}>
								<Select
									size='small'
									value={filters.range}
									options={rangeOptions}
									onChange={(v) => setFilters((f) => ({ ...f, range: Number(v) }))}
									className={styles.levelSelect}
								/>
								<Select
									size='small'
									value={filters.event}
									options={eventOptions}
									onChange={(v) => setFilters((f) => ({ ...f, event: v }))}
									className={styles.eventSelect}
								/>
								<Select
									size='small'
									value={filters.ip}
									options={ipOptions}
									onChange={(v) => setFilters((f) => ({ ...f, ip: v }))}
									className={styles.eventSelect}
								/>
								<Select
									size='small'
									value={filters.level}
									options={levelOptions}
									onChange={(v) => setFilters((f) => ({ ...f, level: v }))}
									className={styles.levelSelect}
								/>
								<Input
									size='small'
									allowClear
									value={kwInput}
									onChange={(e) => onKeyword(e.target.value)}
									prefix={<Icon name='material-search' size={12} />}
									placeholder={is_cn ? '搜索消息内容' : 'Search message'}
									className={styles.logSearch}
								/>
								<Button
									size='small'
									icon={<Icon name='material-refresh' size={12} />}
									onClick={() => setReload((x) => x + 1)}
								>
									{is_cn ? '刷新' : 'Refresh'}
								</Button>
								<div className={styles.autoRefresh}>
									<Switch
										size='small'
										checked={autoRefresh}
										onChange={setAutoRefresh}
									/>
									<span>{is_cn ? '自动刷新' : 'Auto'}</span>
								</div>
							</div>
						)}
					</div>
					<LogContent logs={logs} activeTab={activeTab} isMaximized={isMaximized} />
				</Modal>
			</GlobalProvider>
		</AntdProvider>
	)
}

export default LogWindow
