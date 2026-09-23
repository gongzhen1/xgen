/**
 * 高级页面编译工具
 * 使用 @babel/standalone 在浏览器内把用户编写的 React(JS/JSX) 源码编译成 IIFE：
 * - 剥离 import/export 语句
 * - 收敛 `export default` 为 __CustomPageEntry
 * - 依赖(React/hooks/antd)由运行时 window.__CustomPageRuntime 注入，自身不打包
 * - 末尾写入 window.__CustomPageRegistry[pageName] = { entry, code }
 * 返回 { code, entry }
 */
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
	const mod: any = await import('@babel/standalone')
	return mod.default || mod
}

/**
 * 编译 JS/JSX 源码为可注入的 IIFE。仅使用 React 预设，不引入 TypeScript。
 */
export async function compileTsx(source: string, pageName: string, entryName = DEFAULT_ENTRY): Promise<CompileResult> {
	const Babel = await loadBabel()
	const transformed = Babel.transform(source, {
		filename: `${pageName}.jsx`,
		sourceType: 'module',
		presets: [Babel.availablePresets['react']].filter(Boolean),
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
    Calendar
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