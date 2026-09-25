import React from 'react'
import ReactDOM from 'react-dom'
import { useEffect, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Spin, Result, Empty } from 'antd'

import NotFound from '@/pages/404'

import { isLegacyIiife, loadCustomPageComponent, loadCustomPageModule } from './compile'
import { resolveVendorBase } from '@/utils/vendor-importmap'

// antd 4.24 入口没有 default 导出，用 require 取完整 CJS 导出表（供自定义页面运行时注入）
const antd: any = require('antd')

interface IProps {
	pageName: string
	/** 额外传给组件的外部参数（如 query 里的字段） */
	props?: Record<string, any>
	height?: string
}

/**
 * 按需加载 HeroUI 预构建样式（幂等）。
 * 路径与 compile.ts 的 importmap vendor 基址保持一致。
 */
function ensureHeroUIStyles(): Promise<void> {
	const id = 'heroui-vendor-style'
	if (document.getElementById(id)) return Promise.resolve()
	const v = resolveVendorBase()
	return new Promise((resolve) => {
		const link = document.createElement('link')
		link.id = id
		link.rel = 'stylesheet'
		link.href = `${v}heroui/heroui.min.css`
		link.onload = () => resolve()
		link.onerror = () => resolve() // 样式失败不阻塞渲染
		document.head.appendChild(link)
	})
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
		// 注入运行时依赖（与宿主共享 React/ReactDOM/antd 实例）
		const w: any = window
		w.__CustomPageRuntime = { React, ReactDOM, antd, ...(React as any), ...antd }

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
			.then(async (res) => {
				if (cancelled) return
				const data = res?.data
				setLabel(String(data?.label || '').trim())
				if (!data || !data.jscode) {
					setErr(data?.status === 'unpublished' ? '该页面尚未发布' : '未获取到编译代码')
					return
				}
				// ESM 产物引用 HeroUI 时按需加载样式
				const legacy = isLegacyIiife(data.jscode)
				if (!legacy && data.jscode.includes('@heroui/react')) {
					await ensureHeroUIStyles()
				}
				const Comp2 = legacy
					? await loadCustomPageComponent(pageName, data.jscode)
					: await loadCustomPageModule(data.jscode)
				if (!cancelled) setComp(() => Comp2)
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