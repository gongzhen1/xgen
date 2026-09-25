import * as React from 'react'
import * as antd from 'antd'
import { useEffect, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Spin, Result, Empty } from 'antd'

import NotFound from '@/pages/404'

import { loadCustomPageComponent } from './compile'

interface IProps {
	pageName: string
	/** 额外传给组件的外部参数（如 query 里的字段） */
	props?: Record<string, any>
	height?: string
}

/**
 * 高级页面运行时：指定 pageName，拉取已编译 jscode → 注入 → 渲染。
 * 需保证与宿主共享同一 React 实例（含 hooks 与 antd 组件）。
 */
const CustomPageView = ({ pageName, props = {}, height }: IProps) => {
	const [Comp, setComp] = useState<any>(null)
	const [err, setErr] = useState('')
	const [loading, setLoading] = useState(false)
	const [label, setLabel] = useState('')
	const [notFound, setNotFound] = useState(false)

	// 页面标题：取页面的 label，为空时保持布局默认标题（不覆盖）
	useEffect(() => {
		if (!label) return
		const prev = document.title
		document.title = label
		return () => {
			document.title = prev
		}
	}, [label])

	useEffect(() => {
		let cancelled = false
		setComp(null)
		setErr('')
		setLabel('')
		setNotFound(false)
		if (!pageName) {
			setErr('缺少页面标识 pageName')
			return
		}
		// 注入运行时依赖（与宿主共享 React/antd 实例）
		const w: any = window
		w.__CustomPageRuntime = { React, ...(React as any), ...antd }

		setLoading(true)
		fetch(`/api/custompage/render/${encodeURIComponent(pageName)}`)
			.then((r) => {
				if (!r.ok) {
					const e: any = new Error(`HTTP ${r.status}`)
					e.status = r.status
					return Promise.reject(e)
				}
				return r.json()
			})
			.then((res) => {
				if (cancelled) return
				const data = res?.data
				setLabel(String(data?.label || '').trim())
				if (!data || !data.jscode) {
					setErr(data?.status === 'unpublished' ? '该页面尚未发布' : '未获取到编译代码')
					return
				}
				return loadCustomPageComponent(pageName, data.jscode).then((Comp2) => {
					if (!cancelled) setComp(() => Comp2)
				})
			})
			.catch((e: any) => {
				if (cancelled) return
				// 页面不存在：复用 CUI 的 404 页面展示
				if (e?.status === 404) {
					setNotFound(true)
					return
				}
				setErr(String(e?.message || e))
			})
			.finally(() => {
				if (!cancelled) setLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [pageName])

	if (notFound) {
		return <NotFound />
	}
	if (err) {
		return <Result status='warning' title='无法渲染' subTitle={err} />
	}
	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
				<Spin tip='页面加载中...' />
			</div>
		)
	}
	if (!Comp) {
		return <Empty description='页面为空，请在脚本编辑器中编辑并发布' />
	}

	return (
		<ErrorBoundary
			fallbackRender={({ error }) => <Result status='error' title='页面运行出错' subTitle={String(error?.message || error)} />}
		>
			<div style={{ height: height || '100%', overflow: 'auto' }}>
				{Comp ? React.createElement(Comp, props) : null}
			</div>
		</ErrorBoundary>
	)
}

export default CustomPageView