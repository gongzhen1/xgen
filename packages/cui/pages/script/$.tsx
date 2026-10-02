import { useEffect, useRef, useState } from 'react'
import { Select, Tooltip, message } from 'antd'
import Editor from 'react-monaco-editor'
import { useSearchParams } from '@umijs/max'
import { useMemoizedFn } from 'ahooks'
import clsx from 'clsx'

import styles from './index.less'

import { compileTsx, compileTsxEsm, compileVueSfc, formatPageCode, hasEsmImport, isVueSfc } from '@/components/custompage/compile'
import AiPanel from './components/AiPanel'

// 华为初始模板
const INITIAL_CODE = `/*
/*
* Copyright (c) XXX Technologies Co., Ltd. 2024-2025. All rights reserved.
*/
function run(params) {
    console.log(params);
    return params;
}
  `

// 高级页面初始模板（原生 React JS/JSX，发布时编译）
const ADVANCED_INITIAL_CODE = `import { useState, useEffect } from 'react';
import { Card, Table, Space, Button, message } from 'antd';

// 样式统一用 class 管理：顶层定义一段 CSS 字符串，在根节点用 <style> 渲染出来，组件里用 className 引用
// （不要内联 style / styled-components；类名加页面前缀避免污染宿主）
const css = \`
.mypage { padding: 16px; background: #f5f7fa; min-height: 100%; }
.mypage-hd { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.mypage-title { margin: 0; font-size: 16px; font-weight: 600; color: #1f2937; }
.mypage-tip { font-size: 12px; color: #6b7280; }
\`;

// 导出一个默认组件，发布后即可在 /admin/render/{pagename} 预览
export default function MyPage({ name }) {
  const [list, setList] = useState([
    { id: 1, name: '示例一' },
    { id: 2, name: '示例二' }
  ]);

  return (
    <div className="mypage">
      <style>{css}</style>
      <div className="mypage-hd">
        <h3 className="mypage-title">欢迎，{name || '高级页面'}</h3>
        <span className="mypage-tip">样式写在 css 字符串里，用 className 引用</span>
      </div>
      <Card>
        <Space style={{ marginBottom: 12 }}>
          <Button type="primary" onClick={() => message.success('Hello Custom Page!')}>
            点我
          </Button>
        </Space>
        <Table
          rowKey="id"
          dataSource={list}
          pagination={false}
          columns={[
            { key: 'id', title: 'ID', dataIndex: 'id' },
            { key: 'name', title: '名称', dataIndex: 'name' }
          ]}
        />
      </Card>
    </div>
  );
}
`

// Vue 单文件组件初始模板（原生 SFC 写法，发布时由框架编译集成）
// 依赖需自行声明：@cdn 引资源（JS 按序、CSS 并行）；插件在 <script setup> 顶层用注入的 app 注册
const VUE_INITIAL_CODE = `<!-- Element Plus：依赖全部由页面声明，框架不再自动注入，换其他 UI 框架改这里即可 -->
<!-- @cdn https://unpkg.com/element-plus@2.5.3/dist/index.css -->
<!-- @cdn https://unpkg.com/element-plus@2.5.3/dist/index.full.min.js -->
<!-- @cdn https://unpkg.com/element-plus@2.5.3/dist/locale/zh-cn.min.js -->
<template>
  <el-config-provider :locale="zhCn">
    <div class="vue-page">
      <h2>{{ title }}</h2>
      <el-button type="primary" :loading="loading" @click="load">刷新</el-button>
      <el-table :data="rows" v-loading="loading" border stripe style="width: 100%; margin-top: 12px">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="名称" min-width="180" />
      </el-table>
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// app 是框架注入的 createApp 实例（挂载前已就绪），第三方插件在这里注册
app.use(ElementPlus)

// 中文语言包由 @cdn 加载后挂在全局，交给 el-config-provider
const zhCn = window.ElementPlusLocaleZhCn

const title = ref('Vue 页面')
const rows = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await fetch('/api/__yao/table/sys.page/search?page=1&pagesize=20')
    const json = await res.json()
    rows.value = json.data || []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.vue-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100%;
}
</style>
`

type DebugAction = 'problem' | 'input' | 'output' | 'log'

/** 高级页面类型：advanced-react = React 组件(JSX)，advanced-vue = Vue 组件(SFC)；advanced 为历史遗留值 */
const isAdvancedType = (type?: string) => type === 'advanced-react' || type === 'advanced' || type === 'advanced-vue'
const isVueType = (type?: string) => type === 'advanced-vue'

const editorOptions = {
	readOnly: false,
	automaticLayout: true,
	minimap: { enabled: true },
	scrollBeyondLastLine: false,
	fontSize: 14,
	lineNumbers: 'on' as const,
	roundedSelection: false,
	wordWrap: 'on' as const,
	formatOnPaste: true,
	formatOnType: true,
	renderLineHighlight: 'none' as const,
	smoothScrolling: true,
	padding: { top: 15, bottom: 15 },
	lineNumbersMinChars: 3,
	scrollbar: { verticalScrollbarSize: 8, horizontalSliderSize: 8, useShadows: false }
}

const debugEditorOptions = {
	...editorOptions,
	minimap: { enabled: false }
}

const Index = () => {
	const [searchParams] = useSearchParams()

	const [fileType] = useState<string>(() => searchParams.get('type') || 'script')
	const [currentLanguage, setCurrentLanguage] = useState<string>(() => searchParams.get('language') || 'javascript')
	const fileTypeRef = useRef(fileType)

	const [showDebugPanel, setShowDebugPanel] = useState(false)
	const [debugPanelH, setDebugPanelH] = useState('0px')
	const [activeDebugAction, setActiveDebugAction] = useState<DebugAction>('input')
	const [functionNames, setFunctionNames] = useState<string[]>([])
	const [debugFunc, setDebugFunc] = useState('')

	const [scriptContent, setScriptContent] = useState('')
	const [debugContent, setDebugContent] = useState('{\n}')
	const [isAdvanced, setIsAdvanced] = useState(false)
	const [isVuePage, setIsVuePage] = useState(false)
	const [publishing, setPublishing] = useState(false)
	const [aiOpen, setAiOpen] = useState(false)

	// monaco 实例引用与格式化并发锁，供 Shift+Alt+F 格式化使用
	const editorRef = useRef<any>(null)
	const monacoRef = useRef<any>(null)
	const formattingRef = useRef(false)

	// fetch 在 HTTP 4xx/5xx 时不会抛错，需手动检查 resp.ok，
	// 否则接口报错也会被当作成功并弹出“保存成功/发布成功”。
	const handleResp = async (resp: Response) => {
		if (resp.ok) return await resp.json()
		let msg = `请求失败 (HTTP ${resp.status})`
		try {
			const data = await resp.json()
			if (data?.message) msg = String(data.message)
		} catch {
			// 忽略非 JSON 响应体
		}
		throw new Error(msg)
	}

	const scriptPanelH = `calc(100vh - 2.857rem - ${debugPanelH})`
	const debugEditorH = `calc(${debugPanelH} - 2rem)`

	// refs 供回调/事件读取最新值，避免闭包过期
	const inputParamsRef = useRef('{\n}')
	const activeDebugActionRef = useRef<DebugAction>('input')
	const debugFuncRef = useRef('')
	const scriptDataRef = useRef<any>(null)
	const debugEditorReadOnlyRef = useRef(false)
	// 记录最近的运行输出/日志，供 switchDebugAction 立即刷新面板，
	// 避免读取到尚未更新的 state（React setState 异步导致闭包拿到旧值）。
	const executionResultRef = useRef('')
	const executionLogRef = useRef('{\n}')

	// 撤销/反撤销历史管理（最多5步，保存到localStorage）
	const historyRef = useRef<{ stack: string[]; index: number }>({ stack: [], index: -1 })
	const historyKeyRef = useRef('')
	const skipHistoryRef = useRef(false)

	const pushHistory = useMemoizedFn((content: string) => {
		if (skipHistoryRef.current) {
			skipHistoryRef.current = false
			return
		}
		const h = historyRef.current
		// 清除 redo 分支
		h.stack = h.stack.slice(0, h.index + 1)
		h.stack.push(content)
		// 最多保留10步
		if (h.stack.length > 10) h.stack = h.stack.slice(-10)
		h.index = h.stack.length - 1
		localStorage.setItem(historyKeyRef.current, JSON.stringify(h))
	})

	const undo = useMemoizedFn(() => {
		const h = historyRef.current
		if (h.index <= 0) return
		h.index--
		skipHistoryRef.current = true
		setScriptContent(h.stack[h.index])
	})

	const redo = useMemoizedFn(() => {
		const h = historyRef.current
		if (h.index >= h.stack.length - 1) return
		h.index++
		skipHistoryRef.current = true
		setScriptContent(h.stack[h.index])
	})

	function extractFunctionNames(code: string): string[] {
		const regex = /\b(async\s+)?function(\s*\*?\s*)([^\s(]+)/g
		const names: string[] = []
		let match
		while ((match = regex.exec(code)) !== null) {
			const name = match[3].trim()
			if (name) names.push(name)
		}
		return [...new Set(names)]
	}

	// 查询脚本内容
	const query = async () => {
		const id = searchParams.get('id')
		if (!id) {
			message.error('参数id不存在')
			return
		}
		try {
			const resp = await fetch(`/api/__yao/form/sys.${fileTypeRef.current}/find/${id}`)
			const data = await handleResp(resp)
			scriptDataRef.current = data
			// 高级页面分 React(advanced-react，源码 .jsx) 与 Vue(advanced-vue，源码 .vue) 两类
			const advanced = isAdvancedType(data?.type)
			const vue = isVueType(data?.type) || (searchParams.get('name') || '').endsWith('.vue')
			setIsAdvanced(advanced)
			setIsVuePage(vue)
			// 高级页面：React(JS/JSX) 用 javascript 高亮；Vue SFC 源码用 html 高亮
			const content =
				data?.content ||
				(advanced
					? vue
						? VUE_INITIAL_CODE
						: ADVANCED_INITIAL_CODE
					: fileTypeRef.current === 'script'
						? INITIAL_CODE
						: '{}')
			if (advanced) setCurrentLanguage(vue || isVueSfc(content) ? 'html' : 'javascript')
			setScriptContent(content)
			// 初始化历史
			const scriptId = searchParams.get('id') || ''
			historyKeyRef.current = `script:${scriptId}:${fileTypeRef.current}:history`
			historyRef.current = { stack: [content], index: 0 }
			localStorage.setItem(historyKeyRef.current, JSON.stringify(historyRef.current))
			if (fileTypeRef.current === 'script') {
				const names = extractFunctionNames(data?.content || '')
				setFunctionNames(names)
				if (names.length > 0) {
					setDebugFunc(names[0])
					debugFuncRef.current = names[0]
					const inputParamsCache = localStorage.getItem(`script:${data?.id}:input:${names[0]}`)
					if (inputParamsCache) {
						inputParamsRef.current = JSON.parse(inputParamsCache)
						setDebugContent(inputParamsRef.current)
					}
				}
			}
		} catch (err: any) {
			message.error(err?.message || JSON.stringify(err))
		}
	}

	useEffect(() => {
		query()
	}, [])

	// 保存内容
	const save = async () => {
		if (!scriptDataRef.current) return
		scriptDataRef.current.content = scriptContent
		setFunctionNames(extractFunctionNames(scriptContent))
		try {
			await handleResp(
				await fetch(`/api/__yao/form/sys.${fileTypeRef.current}/save`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(scriptDataRef.current)
				})
			)
			message.success('保存成功')
		} catch (err: any) {
			message.error(err?.message || JSON.stringify(err))
		}
	}

	// 发布高级页面：只编译当前 TSX 并存 jscode（预览由工具栏「运行」在新标签打开）
	const publish = async () => {
		console.log('[publish] click', { hasData: !!scriptDataRef.current, isAdvanced })
		if (!scriptDataRef.current) {
			message.warning('页面数据尚未加载完成，请稍后重试或点刷新按钮')
			return
		}
		if (!isAdvanced) {
			message.warning('当前页面不是高级页面（React/Vue），无需发布')
			return
		}
		if (!scriptContent || !scriptContent.trim()) {
			message.warning('页面内容为空')
			return
		}
		setPublishing(true)
		try {
			const pageName = searchParams.get('name') || `page_${scriptDataRef.current.id}`
			// Vue SFC 源码（<template>/<script> 原生写法）优先识别：script setup 里的
			// import 会误判成 ESM，必须先走 Vue 编译分支（@vue/compiler-sfc 浏览器内编译）
			const vue = isVueSfc(scriptContent)
			const esm = !vue && hasEsmImport(scriptContent)
			console.log('[publish] compiling...', { pageName, vue, esm })
			// 标准 ESM import 写法走浏览器原生模块（importmap 解析 react/antd/@heroui/react）；
			// 无 import 的旧代码保持 IIFE 兼容模式
			const code = vue
				? (await compileVueSfc(scriptContent, pageName)).code
				: esm
					? await compileTsxEsm(scriptContent, pageName)
					: (await compileTsx(scriptContent, pageName)).code
			console.log('[publish] compiled, bytes:', code.length)
			await handleResp(
				await fetch('/api/custompage/publish', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id: scriptDataRef.current.id, jscode: code, entry: 'default' })
				})
			)
			console.log('[publish] published OK')
			message.success('发布成功')
		} catch (err: any) {
			// message 静态方法若因兼容问题不显示，console 兜底保证错误可见
			console.error('[publish] failed:', err)
			message.error(`发布失败: ${err?.message || JSON.stringify(err)}`)
		} finally {
			setPublishing(false)
		}
	}

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.ctrlKey && event.code === 'KeyS') {
			event.preventDefault()
			save()
		}
	}

	useEffect(() => {
		document.addEventListener('keydown', handleKeydown)
		return () => document.removeEventListener('keydown', handleKeydown)
	}, [scriptContent, fileType])

	// 切换调试函数
	const onFuncChange = (val: string) => {
		setDebugFunc(val)
		debugFuncRef.current = val
		const inputParamsCache = localStorage.getItem(`script:${scriptDataRef.current?.id}:input:${val}`)
		if (inputParamsCache) {
			inputParamsRef.current = JSON.parse(inputParamsCache)
			setDebugContent(inputParamsRef.current)
			switchDebugAction('input')
		}
	}

	// 切换调试面板
	const switchDebugPanel = () => {
		setShowDebugPanel((prev) => !prev)
		setDebugPanelH('250px')
	}

	// 运行：高级页面在新标签直接打开页面；脚本仍打开调试面板
	const handleRun = () => {
		if (isAdvanced) {
			const pageName = searchParams.get('name') || `page_${scriptDataRef.current?.id}`
			window.open(`/admin/render/${pageName}`, '_blank')
			return
		}
		switchDebugPanel()
	}

	// 执行脚本
	const runScript = async () => {
		if (!debugFuncRef.current) {
			message.warning('请保存之后选择调试函数!')
			return
		}
		try {
			const params = JSON.parse(inputParamsRef.current)
			const resp = await fetch('/api/script/run', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: scriptDataRef.current?.id,
					func: debugFuncRef.current,
					input: params
				})
			})
			const output = await handleResp(resp)
			const outputStr = JSON.stringify(output)
			executionResultRef.current = outputStr
			setDebugContent(outputStr)
			switchDebugAction('output')
		} catch (err: any) {
			const errMsg = `执行错误: ${err?.message || JSON.stringify(err)}`
			executionLogRef.current = errMsg
			setDebugContent(errMsg)
			switchDebugAction('log')
		}
	}

	// 保存输入参数
	const saveInput = () => {
		if (!debugFuncRef.current) {
			message.warning('请先保存之后选择调试函数!')
			return
		}
		localStorage.setItem(
			`script:${scriptDataRef.current?.id}:input:${debugFuncRef.current}`,
			JSON.stringify(inputParamsRef.current)
		)
	}

	// 切换调试面板 Tab
	const switchDebugAction = (command: DebugAction) => {
		setActiveDebugAction(command)
		activeDebugActionRef.current = command
		debugEditorReadOnlyRef.current = command !== 'input'
		switch (command) {
			case 'input':
				setDebugContent(inputParamsRef.current)
				break
			case 'output':
				setDebugContent(executionResultRef.current)
				break
			case 'log':
				setDebugContent(executionLogRef.current)
				break
			default:
				break
		}
	}

	const onScriptChange = (value: string) => {
		setScriptContent(value)
		pushHistory(value)
		// 高级页面按内容实时切换语法高亮（Vue SFC ↔ React JSX）
		if (isAdvanced) setCurrentLanguage(isVueSfc(value) ? 'html' : 'javascript')
	}

	const onDebugChange = (value: string) => {
		if (activeDebugActionRef.current === 'input') {
			inputParamsRef.current = value
		}
		setDebugContent(value)
	}

	// 代码格式化：按页面类型选 prettier 解析器（Vue SFC / React TSX / JSON）。
	// 用 executeEdits 写入，monaco 会触发 onChange → 记录历史，可 Ctrl+Z 撤销。
	const formatDocument = useMemoizedFn(async () => {
		const editor = editorRef.current
		if (!editor || formattingRef.current) return
		const value: string = editor.getValue()
		if (!value || !value.trim()) return
		const model = editor.getModel()
		if (!model) return
		const mode = isVuePage || isVueSfc(value) ? 'vue' : currentLanguage === 'json' ? 'json' : 'react'
		formattingRef.current = true
		try {
			const formatted = await formatPageCode(value, mode)
			if (formatted !== value) {
				editor.pushUndoStop()
				editor.executeEdits('custompage.format', [
					{ range: model.getFullModelRange(), text: formatted, forceMoveMarkers: true }
				])
				editor.pushUndoStop()
			}
		} catch (err: any) {
			message.error(`格式化失败: ${err?.message || JSON.stringify(err)}`)
		} finally {
			formattingRef.current = false
		}
	})

	// monaco 挂载后保存实例，并注册 Shift+Alt+F 格式化快捷键
	const handleEditorDidMount = (editor: any, monaco: any) => {
		editorRef.current = editor
		monacoRef.current = monaco
		editor.addAction({
			id: 'custompage.format',
			label: '格式化代码',
			keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
			run: () => formatDocument()
		})
	}

	const showRunBtn = fileType === 'script' || isAdvanced

	return (
		<div className={styles._local}>
			{/* 华为风格工具栏 */}
			<div className={clsx('studio', 'toolbar', 'script__toolbar')}>
				<div className='left'>
					<div className='item'>
						<Tooltip title='保存(Ctrl+S)'>
							<div className='toolbar-item' onClick={save}>
								<span className='icon-tb-save'></span>
							</div>
						</Tooltip>
					</div>
					<div className='item'>
						<Tooltip title='另存为(Alt+Shift+S)'>
							<div className='toolbar-item'>
								<span className='icon-tb-clone'></span>
							</div>
						</Tooltip>
					</div>
					<div className='item'>
						<Tooltip title='属性(Alt+Shift+P)'>
							<div className='toolbar-item'>
								<span className='icon-tb-edit'></span>
							</div>
						</Tooltip>
					</div>
					{isAdvanced && (
						<div className='item'>
							<Tooltip title='发布：编译当前页面（React/Vue）并保存'>
								<div className={`toolbar-item ${publishing ? 'is-disabled' : ''}`} onClick={() => !publishing && publish()}>
									<span className='icon-tb-publish'></span>
								</div>
							</Tooltip>
						</div>
					)}
					{showRunBtn && (
						<div className='item'>
							<Tooltip title={isAdvanced ? '运行：在新标签页打开页面' : '运行(Ctrl+R)'}>
								<div className='toolbar-item' onClick={handleRun}>
									<span className='icon-tb-play'></span>
								</div>
							</Tooltip>
						</div>
					)}

					<div className='item'>
						<Tooltip title='撤销(Ctrl+Z)'>
							<div className='toolbar-item' onClick={undo}>
								<span className='icon-tb-undo'></span>
							</div>
						</Tooltip>
					</div>
					<div className='item'>
						<Tooltip title='重做(Ctrl+Y)'>
							<div className='toolbar-item' onClick={redo}>
								<span className='icon-tb-redo'></span>
							</div>
						</Tooltip>
					</div>
					<div className='item'>
						<Tooltip title='刷新当前引入的脚本到最新状态(Alt+m)'>
							<div className='toolbar-item' onClick={query}>
								<span className='icon-tb-refresh'></span>
							</div>
						</Tooltip>
					</div>
					<div className='item'>
						<Tooltip title='AI 生成'>
							<div className={clsx('toolbar-item', aiOpen && 'active')} onClick={() => setAiOpen((v) => !v)}>
								<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
									<rect x='4' y='4' width='16' height='16' rx='3' />
									<circle cx='9' cy='10' r='1.2' fill='currentColor' />
									<circle cx='15' cy='10' r='1.2' fill='currentColor' />
									<path d='M9 15h6' />
									<path d='M12 1v3' />
									<path d='M12 20v3' />
									<path d='M1 12h3' />
									<path d='M20 12h3' />
								</svg>
							</div>
						</Tooltip>
					</div>
				</div>
			</div>

			<div className='script__builder'>
				<div className='builder script-builder dark'>
					<div className='canvas'>
						<div className='script-editors script-builder__editors'>
							<Editor
								width='100%'
								height={scriptPanelH}
								language={currentLanguage}
								theme='vs-dark'
								value={scriptContent}
								onChange={onScriptChange}
								options={editorOptions}
								editorDidMount={handleEditorDidMount}
							/>
						</div>
						{/* 可折叠调试面板 */}
						{showDebugPanel && (
							<div className='script-runner dark script-builder__panel' style={{ height: debugPanelH }}>
								<div className='script-runner__handle'>
									<div className='script-runner__handle-overlay' style={{ display: 'none' }} />
								</div>
								<div className='script-runner__nav'>
									<div
										className={clsx(
											'script-runner__nav-item',
											activeDebugAction === 'problem' && 'script-runner__nav-item--active'
										)}
										onClick={() => switchDebugAction('problem')}
									>
										<span className='label'>问题</span>
									</div>
									<div
										className={clsx(
											'script-runner__nav-item',
											activeDebugAction === 'input' && 'script-runner__nav-item--active'
										)}
										onClick={() => switchDebugAction('input')}
									>
										<span className='label'>输入参数</span>
									</div>
									<div
										className={clsx(
											'script-runner__nav-item',
											activeDebugAction === 'output' && 'script-runner__nav-item--active'
										)}
										onClick={() => switchDebugAction('output')}
									>
										<span className='label'>输出参数</span>
									</div>
									<div
										className={clsx(
											'script-runner__nav-item',
											activeDebugAction === 'log' && 'script-runner__nav-item--active'
										)}
										onClick={() => switchDebugAction('log')}
									>
										<span className='label'>日志</span>
									</div>
									<div className='script-runner__nav-space'></div>
									<div>
										<Select
											className='func-select'
											dropdownClassName='func-select-dropdown'
											value={debugFunc}
											onChange={onFuncChange}
											options={functionNames.map((func) => ({ value: func }))}
											getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
										/>
									</div>
									<Tooltip title='清除日志输出'>
										<div className='script-runner__nav-item'>
											<i className='icon-tb-clear'></i>
										</div>
									</Tooltip>
									<Tooltip title='运行脚本'>
										<div className='script-runner__nav-item' onClick={runScript}>
											<i className='icon-tb-play'></i>
										</div>
									</Tooltip>
									<Tooltip title='保存输入参数'>
										<div className='script-runner__nav-item' onClick={saveInput}>
											<i className='icon-tb-save'></i>
										</div>
									</Tooltip>
								</div>
								<div className='script-runner__body'>
									<div className='simple-editor dark script-runner__body-editor'>
										<Editor
											width='100%'
											height={debugEditorH}
											language='json'
											theme='vs-dark'
											value={debugContent}
											onChange={onDebugChange}
											options={{
												...debugEditorOptions,
												readOnly: activeDebugAction !== 'input'
											}}
										/>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
			<AiPanel
				open={aiOpen}
				onClose={() => setAiOpen(false)}
				getCurrentCode={() => scriptContent}
				onInsertCode={(code: string) => {
					skipHistoryRef.current = true
					setScriptContent(code)
					message.success('已插入到编辑器，可 Ctrl+Z 撤销')
				}}
				fileType={fileType}
				isAdvanced={isAdvanced}
				isVue={isVuePage}
			/>
		</div>
	)
}

export default new window.$app.Handle(Index).by(window.$app.memo).get()