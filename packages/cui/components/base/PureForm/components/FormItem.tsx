import { useMemoizedFn } from 'ahooks'
import { Col, Popover, Input, Button, Form } from 'antd'
import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import { PaperPlaneTilt } from 'phosphor-react'
import { useMemo, useState, useRef, useEffect } from 'react'

import { X, Item } from '@/components'
import { useGlobal } from '@/context/app'
import Timeline from '@/components/edit/Timeline'

import styles from '../ai.less'

import type { IPropsFormItem } from '../types'

const { TextArea } = Input

const aiExclude: Record<string, boolean> = {} // AI mapping that does not need to be displayed

const Index = (props: IPropsFormItem) => {
	const { namespace, primary, type, item } = props
	const global = useGlobal()
	const input = useRef<any>(null)
	const [visible, setVisible] = useState(false)
	const [loading, setLoading] = useState(false)

	// view-only 字段取值：X 组件只展开内层 props 对象，Form.Item 注入到顶层的值会丢失，
	// 因此用 useWatch 显式取值后传入 __value
	const form_instance = Form.useFormInstance()
	const bind_value = Form.useWatch(item.bind, form_instance)

	const unLoading = useMemoizedFn(() => setLoading(false))

	useEffect(() => {
		window.$app.Event.on(`${namespace}/${item.bind}/unloading`, unLoading)

		return () => window.$app.Event.off(`${namespace}/${item.bind}/unloading`, unLoading)
	}, [namespace, item])

	const show_ai = useMemo(
		() => global.app_info.optional?.neo?.api && item.edit?.props?.ai && !aiExclude[item.edit?.type],
		[global.app_info.optional?.neo?.api, item.edit?.props?.ai]
	)

	const disabled_props = useMemo(() => {
		if (type === 'view') return { disabled: true }

		const disabled = item.edit?.props?.disabled

		if (typeof disabled === 'undefined') return {}
		if (typeof disabled === 'string') return { disabled: disabled === 'true' || disabled === '1' }

		return { disabled }
	}, [type, item.edit?.props?.disabled])

	const showAI = useMemoizedFn(() => setVisible(true))

	const askAI = useMemoizedFn((e) => {
		e.preventDefault()

		const target = input?.current?.resizableTextArea?.textArea

		if (!target) return
		if (!target.value) return

		window.$app.Event.emit('app/getField', {
			name: item.name,
			bind: item.bind,
			text: target.value,
			config: item
		})

		setVisible(false)
		setLoading(true)
	})

	const Ask = (
		<div className='field_ask_wrap flex'>
			<TextArea
				className='input_ask'
				placeholder={item.edit?.props?.ai?.placeholder}
				bordered
				autoFocus
				autoSize
				ref={input}
				onPressEnter={askAI}
			></TextArea>
			<div className='btn_confirm flex justify_center align_center clickable' onClick={askAI}>
				<PaperPlaneTilt size={16} weight='bold'></PaperPlaneTilt>
			</div>
		</div>
	)

	const Content = (
		<Col className='form_col_wrap relative' span={item.width}>
			{show_ai && (
				<Popover
					overlayClassName={styles.popover}
					placement='topRight'
					trigger='click'
					getPopupContainer={(n) => n.parentElement!}
					destroyTooltipOnHide
					content={Ask}
					open={visible}
					onOpenChange={(v) => {
						if (!v) setVisible(v)
					}}
				>
					<span
						className={clsx([
							'mark_ai absolute flex justify_center align_center clickable',
							visible && 'visible'
						])}
						onClick={showAI}
					>
						AI
					</span>
				</Popover>
			)}
			{loading && (
				<Button className='ai_loading' type='ghost' size='small' loading>
					<span className='mark_ai'>AI</span>
				</Button>
			)}
			{item.edit?.type === 'Timeline' ? (
				<Timeline
					__namespace={namespace}
					__primary={primary}
					__type={type}
					__bind={item.bind}
					__name={item.name}
					__hidelabel={item.edit?.hideLabel || item.hideLabel || undefined}
					{...disabled_props}
					{...item.edit?.props}
				/>
			) : type === 'view' && item.view?.type ? (
				// view-only 字段（form DSL 只配置 view）：用 view 组件渲染，
				// 通过 Form.Item 的 valuePropName 把值注入 __value（view 组件不接 antd value）
				<Item
					{...{ __bind: item.bind, __name: item.name }}
					hideLabel={item.view?.hideLabel || item.hideLabel || undefined}
					valuePropName='__value'
				>
					<X
						type='view'
						name={item.view.type.includes('/') ? item.view.type.split('/')[1] : item.view.type}
						props={{
							...item.view?.props,
							__value: bind_value,
							__namespace: namespace,
							__primary: primary,
							__type: type,
							__bind: item.bind,
							__name: item.name,
							__hidelabel: item.view?.hideLabel || item.hideLabel || undefined
						}}
					></X>
				</Item>
			) : (
				<X
					type='edit'
					name={item.edit?.type || 'Input'}
					props={{
						...item.edit?.props,
						...disabled_props,
						__namespace: namespace,
						__primary: primary,
						__type: type,
						__bind: item.bind,
						__name: item.name,
						__hidelabel: item.edit?.hideLabel || item.hideLabel || undefined
					}}
				></X>
			)}
		</Col>
	)

	return Content
}

export default new window.$app.Handle(Index).by(observer).by(window.$app.memo).get()
