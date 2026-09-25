/**
 * 高级页面（HeroUI/ESM）importmap 早期注入
 *
 * 必须在浏览器原生模块加载器开始任何 ESM 活动（首个 type=module / 原生 import()）
 * 之前完成，否则浏览器会拒绝后注入的 importmap（裸模块无法解析）。
 * 本文件由 global.ts 在应用入口最早期同步执行，远早于任何自定义页面加载。
 *
 * webpack 自身 chunk 是经典脚本，importmap 的存在对其无影响；
 * 裸模块名只在原生 ESM 中才查 importmap。
 */

/**
 * 推导 vendor 资源基址（结尾带 /）。
 * 注意：__webpack_public_path__ 是 webpack chunk 作用域内部变量，
 * 不挂载到 globalThis，无法可靠读取；从主 bundle 的 script 标签 src 推导最稳妥
 * （umi 应用入口固定为 {publicPath}umi.js，标签在 HTML 解析期即存在）。
 */
export function resolveVendorBase(): string {
	const w = window as any
	if (typeof w.__CustomVendorBase === 'string' && w.__CustomVendorBase) {
		const b = w.__CustomVendorBase
		return b.endsWith('/') ? `${b}vendor/` : `${b}/vendor/`
	}
	// 从主 bundle script 标签推导（script.src 返回绝对 URL，importmap 允许绝对地址）
	const scripts = document.getElementsByTagName('script')
	for (let i = 0; i < scripts.length; i++) {
		const src = scripts[i].src
		if (src && /\/umi\.js(\?|#|$)/.test(src)) {
			return src.replace(/umi\.js(\?|#)?.*$/, 'vendor/')
		}
	}
	try {
		const p = (globalThis as any).__webpack_public_path__
		if (typeof p === 'string' && p) return p.endsWith('/') ? `${p}vendor/` : `${p}/vendor/`
	} catch {
		/* ignore */
	}
	return '/vendor/'
}

;(function installCustomVendorImportMap() {
	const w = window as any
	// 部分第三方库顶层引用 process.env.NODE_ENV，浏览器无此全局，提前补兜底
	if (typeof w.process === 'undefined') w.process = { env: { NODE_ENV: 'production' } }
	if (document.querySelector('script[type="importmap"][data-custom-vendor]')) return

	const v = resolveVendorBase()

	const imports: Record<string, string> = {
		react: `${v}react-shim.js`,
		'react/jsx-runtime': `${v}jsx-runtime-shim.js`,
		'react/jsx-dev-runtime': `${v}jsx-runtime-shim.js`,
		'react-dom': `${v}react-dom-shim.js`,
		antd: `${v}antd-shim.js`,
		'@heroui/react': `${v}heroui/heroui.js`
	}

	try {
		const script = document.createElement('script')
		script.type = 'importmap'
		script.setAttribute('data-custom-vendor', '1')
		script.text = JSON.stringify({ imports })
		document.head.appendChild(script)
		w.__CustomPageImportMapInstalled = true
	} catch {
		// 浏览器不支持 importmap 或注入被拒：保持标记未设置，由 compile.ts 懒注入路径再试
	}
})()
