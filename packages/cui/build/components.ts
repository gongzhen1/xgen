/**
 * Generate the Components sss files, for the shadow dom dynamic import
 */

// reflect polyfill（tsyringe 依赖），需在组件模块图加载前执行
import '@abraham/reflection'

// 该脚本运行在 Node 环境，但导入的组件模块图（components/exports → Timeline → @/components）
// 在模块顶层会引用 window / document 等浏览器全局变量，这里补充最小化的浏览器环境 polyfill。
const global_any = globalThis as any
if (typeof global_any.window === 'undefined') {
	global_any.window = global_any
}
if (!global_any.window.$app) {
	global_any.window.$app = {
		Handle: (Component: any) => ({ by: (_: any) => ({ get: () => Component }) }),
		memo: (Component: any) => Component,
		Event: { emit: () => {} }
	}
}
// window/globalThis 上补充常用浏览器 API（供模块顶层副作用使用）
global_any.addEventListener = global_any.addEventListener || (() => {})
global_any.removeEventListener = global_any.removeEventListener || (() => {})
if (typeof global_any.innerWidth === 'undefined') global_any.innerWidth = 1024
if (typeof global_any.innerHeight === 'undefined') global_any.innerHeight = 768
if (typeof global_any.devicePixelRatio === 'undefined') global_any.devicePixelRatio = 1
if (typeof global_any.requestAnimationFrame === 'undefined') {
	global_any.requestAnimationFrame = (cb: any) => setTimeout(cb, 0)
	global_any.cancelAnimationFrame = (id: any) => clearTimeout(id)
}
if (typeof global_any.getComputedStyle === 'undefined') {
	global_any.getComputedStyle = () => ({})
}
if (typeof global_any.matchMedia === 'undefined') {
	global_any.matchMedia = () => ({
		matches: false,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {}
	})
}
if (typeof global_any.location === 'undefined') {
	global_any.location = {
		origin: 'http://localhost',
		href: 'http://localhost/',
		pathname: '/',
		search: '',
		hash: '',
		assign: () => {},
		replace: () => {},
		reload: () => {}
	}
}
if (typeof global_any.navigator === 'undefined') {
	global_any.navigator = { userAgent: 'node' }
}
if (typeof global_any.localStorage === 'undefined') {
	global_any.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }
}
if (typeof global_any.sessionStorage === 'undefined') {
	global_any.sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }
}
const createElementStub = () => ({
	style: {},
	setAttribute: () => {},
	getAttribute: () => null,
	removeAttribute: () => {},
	appendChild: () => {},
	removeChild: () => {},
	addEventListener: () => {},
	removeEventListener: () => {},
	querySelector: () => null,
	querySelectorAll: () => [],
	classList: { add: () => {}, remove: () => {}, contains: () => false },
	dataset: {},
	parentNode: null,
	offsetWidth: 0,
	offsetHeight: 0
})
if (typeof global_any.document === 'undefined') {
	global_any.document = {
		createElement: () => createElementStub(),
		createElementNS: () => createElementStub(),
		querySelector: () => null,
		querySelectorAll: () => [],
		addEventListener: () => {},
		removeEventListener: () => {},
		documentElement: createElementStub(),
		body: createElementStub(),
		head: createElementStub()
	}
}

import child_process from 'child_process'
import fs, { appendFile } from 'fs'
import path from 'path'

const cwd = process.cwd()
const target_root = path.join(cwd, `/public/components`)

// Generate the sss files for the components
const compile = (name: string, component: any) => {
	const output = path.join(target_root, `${name}`)

	// Clean the output directory
	if (fs.existsSync(output)) {
		fs.rmSync(output, { recursive: true })
	}

	// Generate the main.less file import the component styles
	const imports: string[] = []
	let chunkIndex = 0
	component.styles.forEach((style: string) => {
		if (style.startsWith('@/')) {
			imports.push(`@import url('/__yao_admin_root/${style.substring(2, style.length)}');`)
			return
		}
		chunkIndex++
		const lessFile = path.join(cwd, style)
		const targetName = `chunk.${chunkIndex}.css`
		const targetPath = path.join(output, targetName)
		imports.push(`@import url('/__yao_admin_root/components/${name}/${targetName}');`)

		// Compile the less file
		child_process.execSync(`lessc ${lessFile} ${targetPath}`)

		// Replace :global with :host
		const content = fs.readFileSync(targetPath, 'utf8').replace(/:global/g, '')
		fs.writeFileSync(targetPath, content)
	})

	// Create the index.sss file
	const indexFile = path.join(output, `index.sss`)
	fs.writeFileSync(indexFile, imports.join('\n'))
}

// Generate the sss files for the components
const run = async () => {
	// 动态导入，确保上面的 polyfill 先于组件模块图执行
	// tsx 将 .ts 模块编译为 CJS，命名导出挂在 default/module.exports 下，需兼容取用
	const mod = await import('../components/exports')
	const ExportComponents = (mod as any).default?.ExportComponents ?? (mod as any).ExportComponents
	Object.entries(ExportComponents).forEach(([name, component]) => compile(name, component))
}

run().catch((err) => {
	console.error(err)
	process.exit(1)
})
