/**
 * 高级页面编译工具
 * 使用 @babel/standalone 在浏览器内把用户编写的 React(JS/JSX) 源码编译成 IIFE：
 * - 剥离 import/export 语句
 * - 收敛 `export default` 为 __CustomPageEntry
 * - 依赖(React/hooks/antd)由运行时 window.__CustomPageRuntime 注入，自身不打包
 * - 末尾写入 window.__CustomPageRegistry[pageName] = { entry, code }
 * 返回 { code, entry }
 */
import { resolveVendorBase } from '@/utils/vendor-importmap'

export interface CompileResult {
	code: string
	entry: string
}

// 运行时全局名（需在渲染宿主中设置，见 Renderer.tsx）
export const CUSTOM_RUNTIME = '__CustomPageRuntime'
export const CUSTOM_REGISTRY = '__CustomPageRegistry'
export const DEFAULT_ENTRY = 'default'

// babel 编译插件：移除 import；把 export default 收敛成 __CustomPageEntry
// 注意：@babel/standalone 中 path.hub.file.types 是 undefined，必须从插件工厂参数取 types
function stripImportsAndCollectEntry({ types: t }: any) {
	return {
		visitor: {
			ImportDeclaration(path: any) {
				path.remove()
			},
			ExportDefaultDeclaration(path: any) {
				const decl: any = path.node.declaration
				if (decl.type === 'Identifier') {
					path.replaceWith(
						t.variableDeclaration('const', [
							t.variableDeclarator(t.identifier('__CustomPageEntry'), t.identifier(decl.name))
						])
					)
				} else if (decl.type === 'FunctionDeclaration' || decl.type === 'ClassDeclaration') {
					decl.id = t.identifier('__CustomPageEntry')
					path.replaceWith(decl)
				} else {
					path.replaceWith(
						t.variableDeclaration('const', [
							t.variableDeclarator(t.identifier('__CustomPageEntry'), decl)
						])
					)
				}
			}
		}
	}
}

async function loadBabel(): Promise<any> {
	// 动态加载，避免打进主包
	console.log('[compile] loading @babel/standalone...')
	const mod: any = await import('@babel/standalone')
	console.log('[compile] babel loaded')
	return mod.default || mod
}

// ============================== ESM 模式（标准 import + importmap） ==============================

/**
 * 在首次原生 ESM 加载前注入 importmap。
 * webpack 自身的 chunk 是经典脚本，不走浏览器模块图，因此在运行时动态注入仍然有效；
 * 本函数必须在任何 Blob ESM 的 import() 之前调用。
 */
export function ensureImportMap(): void {
	const w: any = window
	if (w.__CustomPageImportMapInstalled) return
	// 应用入口（utils/vendor-importmap.ts）已早期注入时直接复用
	if (document.querySelector('script[type="importmap"][data-custom-vendor]')) {
		w.__CustomPageImportMapInstalled = true
		return
	}

	const v = resolveVendorBase()

	const imports: Record<string, string> = {
		react: `${v}react-shim.js`,
		'react/jsx-runtime': `${v}jsx-runtime-shim.js`,
		'react/jsx-dev-runtime': `${v}jsx-runtime-shim.js`,
		'react-dom': `${v}react-dom-shim.js`,
		antd: `${v}antd-shim.js`,
		'@heroui/react': `${v}heroui/heroui.js`
	}

	const script = document.createElement('script')
	script.type = 'importmap'
	script.setAttribute('data-custom-vendor', '1')
	script.text = JSON.stringify({ imports })
	document.head.appendChild(script)
	w.__CustomPageImportMapInstalled = true
}

/**
 * ESM 编译：只转 JSX（automatic runtime → react/jsx-runtime，用户无需 import React），
 * 完整保留 import/export。用户代码按标准 ESM 书写，裸模块由 importmap 解析。
 */
export async function compileTsxEsm(source: string, pageName: string): Promise<string> {
	const Babel = await loadBabel()
	const transformed = Babel.transform(source, {
		filename: `${pageName}.tsx`,
		sourceType: 'module',
		// 用 availablePresets 对象引用而非字符串名，与旧 compileTsx 保持一致，
		// 避免浏览器端字符串解析 preset 失败；typescript preset 剥离类型（AI 常生成带类型代码）
		presets: [
			[Babel.availablePresets['typescript'], { isTSX: true, allExtensions: true }],
			[Babel.availablePresets['react'], { runtime: 'automatic' }]
		],
		comments: false,
		compact: false
	})
	return `${transformed.code || ''}\n//# sourceURL=custompage://${pageName}.jsx\n`
}

/**
 * 加载 ESM 产物：Blob URL + 浏览器原生动态 import，返回默认导出的组件。
 * webpackIgnore 阻止 webpack 把变量 import() 改写成 chunk/context 加载
 * （blob: URL 不在其模块表中，改写后会报 Cannot find module）；
 * 浏览器按原生 ESM 求值，裸模块由 importmap 解析。
 */
export async function loadCustomPageModule(code: string): Promise<any> {
	ensureImportMap()
	const blob = new Blob([code], { type: 'text/javascript' })
	const url = URL.createObjectURL(blob)
	try {
		const mod = await import(/* webpackIgnore: true */ /* @vite-ignore */ url)
		const Comp = mod?.default
		if (!Comp) throw new Error('页面缺少 export default 组件')
		return Comp
	} catch (e) {
		// blob 模块图失败时浏览器只给笼统的 "Failed to fetch dynamically imported module"，
		// 这里逐层诊断 importmap 与各依赖，暴露真实原因
		const detail = await diagnoseModuleGraph(e)
		throw new Error(`页面模块加载失败：${detail}`)
	} finally {
		// 模块求值完成后即可释放，组件引用仍在内存
		setTimeout(() => URL.revokeObjectURL(url), 0)
	}
}

/** 逐层探测 importmap 模块图，返回可读的失败原因 */
async function diagnoseModuleGraph(originalError: unknown): Promise<string> {
	const lines: string[] = []

	// 浏览器是否支持 importmap（Chrome/Edge 89+）
	const supportsImportMap =
		typeof (HTMLScriptElement as any).supports === 'function' &&
		(HTMLScriptElement as any).supports('importmap')
	if (!supportsImportMap) {
		lines.push('当前浏览器不支持 importmap（需 Chrome/Edge 89+），请升级浏览器')
		return lines.join('；')
	}

	const allMaps = Array.from(document.querySelectorAll('script[type="importmap"]'))
	if (allMaps.length > 1) {
		lines.push(`文档中存在 ${allMaps.length} 个 importmap，浏览器只接受第一个，后续的会被忽略`)
	}
	const mapScript = allMaps.find((s) => s.hasAttribute('data-custom-vendor')) || allMaps[0]
	if (!mapScript || !mapScript.textContent) {
		lines.push('importmap 未注入到 document')
	} else {
		let map: any = null
		try {
			map = JSON.parse(mapScript.textContent).imports
		} catch {
			lines.push('importmap JSON 解析失败')
		}
		// 逐个直接加载物理 URL（不经过 importmap），定位资源/顶层求值错误
		if (map) {
			for (const [specifier, target] of Object.entries(map) as [string, string][]) {
				try {
					await import(/* webpackIgnore: true */ /* @vite-ignore */ target)
				} catch (err: any) {
					lines.push(`依赖「${specifier}」(${target}) 加载失败：${err?.message || err}`)
				}
			}
			// 再测裸 specifier，验证 importmap 是否被浏览器接受（注入过晚将无法解析裸模块）
			for (const specifier of ['react', 'react/jsx-runtime', '@heroui/react']) {
				try {
					await import(/* webpackIgnore: true */ /* @vite-ignore */ specifier)
				} catch (err: any) {
					const msg = String(err?.message || err)
					// 直接 import 一个只导出绑定的模块是允许的，解析失败通常是 specifier 错误
					if (/resolve|specifier|Failed to fetch/i.test(msg)) {
						lines.push(`裸模块「${specifier}」无法解析（importmap 可能在模块加载开始后才注入）：${msg}`)
					}
				}
			}
		}
	}
	if (!lines.length) lines.push(String((originalError as any)?.message || originalError))
	return lines.join('；')
}

/** 源码中包含 import 语句时走 ESM 模式 */
export function hasEsmImport(source: string): boolean {
	return /(^|\n)\s*import\s+.*from\s+['"]/.test(source)
}

/** 产物是否为旧 IIFE 格式（带注册表标记） */
export function isLegacyIiife(code: string): boolean {
	return code.includes(CUSTOM_REGISTRY) || code.includes('__CustomPageEntry')
}

/**
 * 编译 JS/JSX 源码为可注入的 IIFE。React + TypeScript 预设（剥离类型注解，兼容 AI 生成的带类型代码）。
 */
export async function compileTsx(source: string, pageName: string, entryName = DEFAULT_ENTRY): Promise<CompileResult> {
	const Babel = await loadBabel()
	const transformed = Babel.transform(source, {
		filename: `${pageName}.tsx`,
		sourceType: 'module',
		presets: [
			[Babel.availablePresets['typescript'], { isTSX: true, allExtensions: true }],
			Babel.availablePresets['react']
		].filter(Boolean) as any[],
		plugins: [stripImportsAndCollectEntry],
		comments: false,
		compact: false
	})

	const body = transformed.code || ''

	const code = `(function () {
  const {
    React,
    useState,
    useEffect,
    useReducer,
    useMemo,
    useCallback,
    useRef,
    useMemoizedFn,
    createPortal,
    PropTypes,
    ConfigProvider,
    message,
    notification,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Button,
    Table,
    DataTable,
    Space,
    Tag,
    Card,
    Row,
    Col,
    Divider,
    Empty,
    Spin,
    List,
    Tree,
    Typography,
    Layout,
    Menu,
    Checkbox,
    Radio,
    Switch,
    DatePicker,
    TimePicker,
    Popconfirm,
    Tooltip,
    Upload,
    Image,
    Badge,
    Tabs,
    Drawer,
    Avatar,
    Progress,
    Descriptions,
    Steps,
    Alert,
    Result,
    Skeleton,
    Carousel,
    Collapse,
    Popover,
    Dropdown,
    Pagination,
    Breadcrumb,
    Timeline,
    Transfer,
    Rate,
    Slider,
    Mentions,
    Cascader,
    TreeSelect,
    AutoComplete,
    Anchor,
    BackTop,
    Statistic,
    Calendar,
    loadCdn
  } = window[${JSON.stringify(CUSTOM_RUNTIME)}] || {};
  const { Title, Paragraph, Text, Link } = Typography || {};
  var __CustomPageEntry;
${body}
  if (typeof __CustomPageEntry === 'undefined' && window[${JSON.stringify(CUSTOM_RUNTIME)}] && window[${JSON.stringify(CUSTOM_RUNTIME)}].React) {
    // 无默认导出时兜底：尝试当作纯 JSX 的默认渲染
    __CustomPageEntry = function () { return window[${JSON.stringify(CUSTOM_RUNTIME)}].React.createElement('div', null, '未提供默认导出'); };
  }
  window[${JSON.stringify(CUSTOM_REGISTRY)}] = window[${JSON.stringify(CUSTOM_REGISTRY)}] || {};
  window[${JSON.stringify(CUSTOM_REGISTRY)}][${JSON.stringify(pageName)}] = {
    entry: typeof __CustomPageEntry === 'undefined' ? null : __CustomPageEntry,
    code: ${JSON.stringify(body)}
  };
})();
`

	return { code, entry: typeof entryName === 'string' && entryName ? entryName : DEFAULT_ENTRY }
}

/**
 * 设置页面渲染所需的运行时依赖（React/antd 等）。需与宿主共用同一 React 实例。
 */
export function ensureCustomPageRuntime(deps: { React?: any; antd?: any; [key: string]: any }): Record<string, any> {
	const w: any = window
	if (!w[CUSTOM_RUNTIME]) {
		w[CUSTOM_RUNTIME] = {}
	}
	Object.keys(deps || {}).forEach((k) => {
		const v = deps[k]
		if (v && v.__esModule && v.default) {
			w[CUSTOM_RUNTIME][k === 'React' ? 'React' : k] = v.default
		} else {
			w[CUSTOM_RUNTIME][k === 'React' ? 'React' : k] = v
		}
	})
	return w[CUSTOM_RUNTIME]
}

/**
 * 把已编译的 IIFE 注入页面并取回组件。
 * 内联 script（script.text）在 appendChild 时即同步执行并写入注册表，
 * 因此直接在 append 后同步读取即可，不依赖 onload 事件（部分环境不会触发）。
 * 同时加超时兜底，避免加载失败时 Promise 永不落定导致一直 loading。
 */
export async function loadCustomPageComponent(pageName: string, code: string): Promise<any> {
	const w: any = window
	if (!w[CUSTOM_RUNTIME]) throw new Error('自定义页面运行时未初始化')

	const getEntry = (): any => {
		const reg = w[CUSTOM_REGISTRY] && w[CUSTOM_REGISTRY][pageName]
		return (reg && reg.entry) || null
	}

	return new Promise((resolve, reject) => {
		const existing = getEntry()
		if (existing) {
			resolve(existing)
			return
		}

		let settled = false
		const done = (entry: any) => {
			if (!settled) {
				settled = true
				resolve(entry)
			}
		}
		const fail = (err: Error) => {
			if (!settled) {
				settled = true
				reject(err)
			}
		}

		try {
			const script = document.createElement('script')
			script.type = 'text/javascript'
			script.text = code
			script.onload = () => {
				const entry = getEntry()
				if (entry) done(entry)
				else fail(new Error('编译产物未注册页面组件'))
			}
			script.onerror = () => fail(new Error('自定义页面脚本加载失败'))
			document.head.appendChild(script)
		} catch (e: any) {
			fail(e instanceof Error ? e : new Error(String(e)))
			return
		}

		// 同步执行完成后立即读取（inline script 是同步的），兜底 onload 不触发的情况
		const entry = getEntry()
		if (entry) {
			done(entry)
			return
		}

		// 超时兜底：确保 Promise 必然落定
		setTimeout(() => fail(new Error('编译产物加载超时')), 3000)
	})
}