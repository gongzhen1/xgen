import { useEffect, useRef, useState } from 'react'
import { Select, Tooltip, message } from 'antd'
import Editor from 'react-monaco-editor'
import { useSearchParams } from '@umijs/max'
import { useMemoizedFn } from 'ahooks'
import clsx from 'clsx'

import styles from './index.less'

import { compileTsx } from '@/components/custompage/compile'

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

// 导出一个默认组件，发布后即可在 /admin/render/{pagename} 预览
export default function MyPage({ name }) {
  const [list, setList] = useState([
    { id: 1, name: '示例一' },
    { id: 2, name: '示例二' }
  ]);

  return (
    <Card title={\`欢迎，\${name || '高级页面'}\`}>
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
          { title: 'ID', dataIndex: 'id' },
          { title: '名称', dataIndex: 'name' }
        ]}
      />
    </Card>
  );
}
`

type DebugAction = 'problem' | 'input' | 'output' | 'log'

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
	const [executionResult, setExecutionResult] = useState('')
	const [executionLog, setExecutionLog] = useState('{\n}')
	const [activeDebugAction, setActiveDebugAction] = useState<DebugAction>('input')
	const [functionNames, setFunctionNames] = useState<string[]>([])
	const [debugFunc, setDebugFunc] = useState('')

	const [scriptContent, setScriptContent] = useState('')
	const [debugContent, setDebugContent] = useState('{\n}')
	const [isAdvanced, setIsAdvanced] = useState(false)
	const [publishing, setPublishing] = useState(false)

	const scriptPanelH = `calc(100vh - 2.857rem - ${debugPanelH})`
	const debugEditorH = `calc(${debugPanelH} - 2rem)`

	// refs 供回调/事件读取最新值，避免闭包过期
	const inputParamsRef = useRef('{\n}')
	const activeDebugActionRef = useRef<DebugAction>('input')
	const debugFuncRef = useRef('')
	const scriptDataRef = useRef<any>(null)
	const debugEditorReadOnlyRef = useRef(false)

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
				const data = await resp.json()
				scriptDataRef.current = data
					setIsAdvanced(data?.type === 'advanced')
					// 高级页面使用原生 React(JS/JSX)，等价于 javascript
					if (data?.type === 'advanced') setCurrentLanguage('javascript')
					const content =
						data?.content ||
						(data?.type === 'advanced'
							? ADVANCED_INITIAL_CODE
							: fileTypeRef.current === 'script'
							? INITIAL_CODE
							: '{}')
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
			await fetch(`/api/__yao/form/sys.${fileTypeRef.current}/save`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(scriptDataRef.current)
			})
			message.success('保存成功')
		} catch (err: any) {
			message.error(err?.message || JSON.stringify(err))
		}
	}

	// 发布高级页面：编译当前 TSX 并存 jscode
	const publish = async () => {
		if (!scriptDataRef.current || !isAdvanced) return
		if (!scriptContent || !scriptContent.trim()) {
			message.warning('页面内容为空')
			return
		}
		setPublishing(true)
		try {
			const pageName = searchParams.get('name') || `page_${scriptDataRef.current.id}`
			const { code } = await compileTsx(scriptContent, pageName)
			await fetch('/api/custompage/publish', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: scriptDataRef.current.id, jscode: code, entry: 'default' })
			})
			message.success('发布成功')
		} catch (err: any) {
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
			const output = await resp.json()
			const outputStr = JSON.stringify(output)
			setExecutionResult(outputStr)
			setDebugContent(outputStr)
			switchDebugAction('output')
		} catch (err: any) {
			const errMsg = `执行错误: ${err?.message || JSON.stringify(err)}`
			setExecutionLog(errMsg)
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
				setDebugContent(executionResult)
				break
			case 'log':
				setDebugContent(executionLog)
				break
			default:
				break
		}
	}

	const onScriptChange = (value: string) => {
		setScriptContent(value)
		pushHistory(value)
	}

	const onDebugChange = (value: string) => {
		if (activeDebugActionRef.current === 'input') {
			inputParamsRef.current = value
		}
		setDebugContent(value)
	}

	const showRunBtn = fileType === 'script'

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
					{showRunBtn && (
						<div className='item'>
							<Tooltip title='运行(Ctrl+R)'>
								<div className='toolbar-item'>
									<span className='icon-tb-play' onClick={switchDebugPanel}></span>
								</div>
							</Tooltip>
						</div>
					)}
					{isAdvanced && (
						<div className='item'>
							<Tooltip title='发布：编译当前 React 页面并保存'>
								<div className={`toolbar-item ${publishing ? 'is-disabled' : ''}`} onClick={() => !publishing && publish()}>
								<span className='icon-tb-publish'></span>
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
							<div className='toolbar-item'>
								<span className='icon-tb-refresh'></span>
							</div>
						</Tooltip>
					</div>
				</div>
				<div className='middle'></div>
				<div className='ml-auto'>
					<div className='item'>
						<Tooltip title='分屏'>
							<div className='toolbar-item'>
								<span className='icon-tb-split-screen'></span>
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
		</div>
	)
}

export default new window.$app.Handle(Index).by(window.$app.memo).get()