import React, { useMemo } from 'react'

import styles from './index.less'

import type { Component } from '@/types'

interface FlowLogEvent {
	time: string
	action: string
	message: string
	round?: number
	node_id?: string
	node_name?: string
	operator?: string
	operator_name?: string
	task_id?: number
	comment?: string
}

interface IProps extends Component.PropsViewComponent {
	__value: string | FlowLogEvent[]
}

const getActionStyle = (action: string): string => {
	const key = action.toLowerCase()
	if (key === '发起' || key === 'start') return styles.actionStart
	if (key === '待审批' || key === 'pending') return styles.actionPending
	if (key === '同意' || key === 'approved' || key === '通过' || key === 'pass') return styles.actionApprove
	if (key === '驳回' || key === 'reject') return styles.actionReject
	if (key === '驳回待重新提交' || key === 'rejected') return styles.actionRejectResubmit
	if (key === '重新提交' || key === 'resubmit') return styles.actionResubmit
	if (key === '结束' || key === 'end' || key === 'finish') return styles.actionEnd
	if (key === '失败' || key === 'fail') return styles.actionFail
	return styles.actionOther
}

const getActionIcon = (action: string): string => {
	const key = action.toLowerCase()
	if (key === '发起' || key === 'start') return 'start'
	if (key === '待审批' || key === 'pending') return 'pending'
	if (key === '同意' || key === 'approved' || key === '通过' || key === 'pass') return 'approve'
	if (key === '驳回' || key === 'reject') return 'reject'
	if (key === '驳回待重新提交' || key === 'rejected') return 'reject_resubmit'
	if (key === '重新提交' || key === 'resubmit') return 'resubmit'
	if (key === '结束' || key === 'end' || key === 'finish') return 'end'
	if (key === '失败' || key === 'fail') return 'fail'
	return 'other'
}

const Index = (props: IProps & { value?: any }) => {
	const { __value } = props
	const effectiveValue = __value ?? props.value

	const events = useMemo<FlowLogEvent[]>(() => {
		if (!effectiveValue) return []

		if (Array.isArray(effectiveValue)) return effectiveValue as FlowLogEvent[]

		if (typeof effectiveValue === 'string') {
			try {
				const parsed = JSON.parse(effectiveValue)
				if (Array.isArray(parsed)) return parsed as FlowLogEvent[]
				return []
			} catch {
				return []
			}
		}

		return []
	}, [effectiveValue])

	if (!events.length) {
		return <span>-</span>
	}

	return (
		<div className={styles.timeline}>
			{events.map((event, index) => {
				const actionStyle = getActionStyle(event.action)
				const iconName = getActionIcon(event.action)
				const prevRound = index > 0 ? Number(events[index - 1].round) || 1 : 0
				const curRound = Number(event.round) || 1
				const showRoundDivider = index === 0 ? curRound > 1 : curRound !== prevRound

				return (
					<React.Fragment key={index}>
						{showRoundDivider && <div className={styles.roundDivider}>第 {curRound} 轮</div>}
						<div className={`${styles.item} ${actionStyle}`}>
						<div className={styles.dot}>
							{iconName === 'start' && (
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
									<polygon points="5 3 19 12 5 21 5 3" />
								</svg>
							)}
							{iconName === 'approve' && (
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
									<polyline points="20 6 9 17 4 12" />
								</svg>
							)}
							{iconName === 'reject' && (
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							)}
							{iconName === 'reject_resubmit' && (
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
									<circle cx="12" cy="12" r="10" />
									<line x1="12" y1="8" x2="12" y2="12" />
									<line x1="12" y1="16" x2="12.01" y2="16" />
								</svg>
							)}
							{iconName === 'resubmit' && (
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
									<polyline points="1 4 1 10 7 10" />
									<polyline points="23 20 23 14 17 14" />
									<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
								</svg>
							)}
							{iconName === 'end' && (
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
									<circle cx="12" cy="12" r="10" />
									<polyline points="9 12 11 14 15 10" />
								</svg>
							)}
							{iconName === 'fail' && (
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
									<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
									<line x1="12" y1="9" x2="12" y2="13" />
									<line x1="12" y1="17" x2="12.01" y2="17" />
								</svg>
							)}
							{(iconName === 'pending' || iconName === 'other') && (
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
									<circle cx="12" cy="12" r="10" />
									<polyline points="12 6 12 12 16 14" />
								</svg>
							)}
						</div>
						<div className={styles.line}></div>
							<div className={styles.content}>
								<div className={styles.time}>
									{event.time}
									{event.node_name && <span className={styles.nodeName}>【{event.node_name}】</span>}
								</div>
								<div className={styles.message}>{event.message}</div>
								{event.comment && <div className={styles.comment}>意见：{event.comment}</div>}
							</div>
						</div>
					</React.Fragment>
					)
				})}
		</div>
	)
}

export default window.$app.memo(Index)