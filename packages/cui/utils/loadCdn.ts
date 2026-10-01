/**
 * 公共 CDN 资源加载器（所有自定义页面可直接调用）
 *
 * 用法（自定义页面脚本中直接使用，无需 import）：
 *   await loadCdn('https://cdn.bootcdn.net/ajax/libs/xlsx/0.18.5/xlsx.full.min.js')
 *   await loadCdn(['https://a/a.js', 'https://b/b.css', 'https://c/c.js'])
 *
 * 特性：
 * - 同时支持 js / css：按 URL 扩展名（忽略 query/hash）识别，.css 用 <link>，其余用 <script>
 * - 支持一次传多个；JS 按传入顺序串行加载执行（保证有依赖关系的库先执行），CSS 并行
 * - 同一 URL 只加载一次；并发调用共享同一个 Promise，不会重复插入标签
 * - 加载失败时 reject，失败的 URL 会从缓存移除，允许下次重试
 */

const CACHE_KEY = '__cdnLoaderCache'

type CdnEntry = { url: string; type: 'js' | 'css' }

function getCache(): Record<string, Promise<CdnEntry>> {
	const w = window as any
	if (!w[CACHE_KEY]) w[CACHE_KEY] = {}
	return w[CACHE_KEY]
}

function extOf(url: string): string {
	const path = String(url).split('?')[0].split('#')[0].toLowerCase()
	const m = path.match(/\.(\w+)$/)
	return m ? m[1] : 'js'
}

function loadOne(url: string): Promise<CdnEntry> {
	const cache = getCache()
	if (cache[url]) return cache[url]
	const isCss = extOf(url) === 'css'
	if (isCss) {
		cache[url] = new Promise<CdnEntry>((resolve, reject) => {
			const link = document.createElement('link')
			link.rel = 'stylesheet'
			link.href = url
			link.setAttribute('data-cdn-loader', '1')
			link.onload = () => resolve({ url, type: 'css' })
			link.onerror = () => {
				link.setAttribute('data-cdn-error', '1')
				delete cache[url]
				reject(new Error('CDN 资源加载失败：' + url))
			}
			document.head.appendChild(link)
		})
		return cache[url]
	}

	// JS：宿主环境存在 SystemJS / RequireJS 时会提供 AMD define，
	// 大量 UMD 库（如 SheetJS）检测到 define.amd 就只注册匿名模块、不挂 window 全局，
	// 导致脚本"加载成功"但 window.XLSX 是空壳。这里先 fetch 源码（要求 CDN 允许 CORS），
	// 包一层函数把 define/module/exports 屏蔽为 undefined，强制 UMD 走浏览器全局分支。
	cache[url] = (async () => {
		let blobUrl = ''
		try {
			const resp = await fetch(url, { mode: 'cors', credentials: 'omit' })
			if (!resp.ok) throw new Error('HTTP ' + resp.status)
			const code = await resp.text()
			const wrapped =
				';(function(){\nvar define=undefined,module=undefined,exports=undefined;\n' +
				code +
				'\n}).call(window);'
			blobUrl = URL.createObjectURL(new Blob([wrapped], { type: 'text/javascript' }))
			await runClassicScript(blobUrl, true)
			return { url, type: 'js' as const }
		} catch {
			// CORS 不允许 fetch 等场景：退回普通 <script src>（UMD 可能被 AMD 接管）
			if (blobUrl) URL.revokeObjectURL(blobUrl)
			await runClassicScript(url, false)
			return { url, type: 'js' as const }
		}
	})().catch((err) => {
		delete cache[url]
		throw err instanceof Error ? err : new Error('CDN 资源加载失败：' + url)
	})
	return cache[url]
}

// 插入经典脚本并等待执行完成；blob=true 时是本地 blob URL（失败即销毁）
function runClassicScript(src: string, isBlob: boolean): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		const script = document.createElement('script')
		if (isBlob) script.src = src
		else {
			script.src = src
			script.async = false
		}
		script.setAttribute('data-cdn-loader', '1')
		script.onload = () => {
			if (isBlob) URL.revokeObjectURL(src)
			resolve()
		}
		script.onerror = () => {
			script.setAttribute('data-cdn-error', '1')
			if (isBlob) URL.revokeObjectURL(src)
			reject(new Error('CDN 资源加载失败：' + src))
		}
		document.head.appendChild(script)
	})
}

export function loadCdn(resources: string | string[]): Promise<CdnEntry[]> {
	const list = (Array.isArray(resources) ? resources : [resources]).filter(Boolean)
	if (!list.length) return Promise.resolve([])
	// CSS 无依赖关系，立即并行发起；JS 按传入顺序串行，保证依赖库先执行
	const settled: Array<Promise<CdnEntry> | null> = new Array(list.length).fill(null)
	let chain: Promise<unknown> = Promise.resolve()
	list.forEach((url, i) => {
		if (extOf(url) === 'css') {
			settled[i] = loadOne(url)
		} else {
			chain = chain.then(() => {
				const p = loadOne(url)
				settled[i] = p
				return p
			})
		}
	})
	return chain.then(() => Promise.all(settled as Promise<CdnEntry>[]))
}

export default loadCdn
