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
 * 源码顶部的 @cdn 声明会转成模块顶层的 await：导入方 await import() 期间即完成加载，
 * 因此外部依赖在组件求值前就绪（与 Vue SFC 的 @cdn 语义一致）。
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

	// @cdn 声明：模块顶层 await 加载（CSS 并行、JS 按声明顺序串行），失败会让 import 直接 reject
	const cdnUrls = extractCdnUrls(source)
	const preload = cdnUrls.length
		? '// @cdn 声明：模块求值前按序加载外部资源（CSS 并行、JS 串行）\n' +
			'await (window.__CustomPageRuntime || {}).loadCdn(' +
			JSON.stringify(cdnUrls) +
			');\n\n'
		: ''

	return `${preload}${transformed.code || ''}\n//# sourceURL=custompage://${pageName}.jsx\n`
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

// ============================== Vue SFC 模式（原生 .vue 源码，编辑器内编译） ==============================

/**
 * Vue 运行时（SFC 编译产物）的固定底座，随 CUI 一起本地部署（public/vendor/vue.global.prod.js，
 * 版本 3.5.43，UMD 全局构建），不再依赖 unpkg 等外部 CDN。
 * 其余依赖（含 UI 框架）一律由页面用 <!-- @cdn url --> 自行声明。
 * 注意：必须用原生 script/link 标签按序加载，不能用 loadCdn——
 * 其 UMD 包装（define/module/exports 置 undefined）会把 vue.global.js 顶层 var 封进函数作用域，
 * 导致 window.Vue 为空。
 */
function vueRuntimeUrl(): string {
	const url = `${resolveVendorBase()}vue.global.prod.js`
	// URL 会在发布时写死进页面产物，用同源相对路径，避免把 localhost/发布机 IP 带进产物，
	// 换 host（localhost ↔ 192.168.x.x）访问渲染页时仍指向同一站点。
	try {
		const u = new URL(url, window.location.href)
		return u.origin === window.location.origin ? u.pathname : u.href
	} catch {
		return url
	}
}

/**
 * 源码是否为 Vue 单文件组件（跳过前导注释后，以 <template>/<script>/<style> 块开头）。
 * 需同时跳过 // 、/* *\/ 与 <!-- --> 三类注释，否则页面顶部的 @cdn 声明会让 SFC 失去识别。
 */
export function isVueSfc(source: string): boolean {
	const s = (source || '').replace(/^(\s|\/\/[^\n]*(\n|$)|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)+/, '')
	return /^<(template|script|style)[\s>]/.test(s)
}

/**
 * 解析源码里声明的 CDN 依赖，按声明先后返回（重复的只保留首次）。
 * 三种注释写法等价，保证 React 与 Vue 页面用法一致：
 *   <!-- @cdn https://a/a.css -->   Vue SFC / HTML 注释
 *   // @cdn https://a/a.js          JS/TS 行注释
 *   /* @cdn https://a/a.js *\/      JS/TS 块注释
 * 由调用方按扩展名分流：CSS 并行加载，JS 按声明顺序串行。
 */
export function extractCdnUrls(source: string): string[] {
	const found: Array<{ index: number; url: string }> = []
	const collect = (re: RegExp) => {
		let m: RegExpExecArray | null
		while ((m = re.exec(source || ''))) found.push({ index: m.index, url: m[1] })
	}
	collect(/<!--\s*@cdn\s+(\S+?)\s*-->/g)
	collect(/^[ \t]*\/\/[ \t]*@cdn[ \t]+(\S+)/gm)
	collect(/\/\*[ \t]*@cdn[ \t]+(\S+?)[ \t]*\*\//g)

	found.sort((a, b) => a.index - b.index)
	const urls: string[] = []
	if (!found.length) return urls
	const seen: Record<string, boolean> = {}
	found.forEach(({ url }) => {
		if (seen[url]) return
		seen[url] = true
		urls.push(url)
	})
	return urls
}

async function loadVueSfcCompiler(): Promise<any> {
	// 动态加载，避免打进主包（与 babel 同理）。
	// 显式指定 esm-browser 构建：cjs 版含 consolidate 惰性 require（velocityjs 等模板引擎），
	// webpack 静态分析会因模块缺失报错；esm-browser 版已剔除且完全自包含。
	// @ts-ignore 子路径无类型声明
	const mod: any = await import('@vue/compiler-sfc/dist/compiler-sfc.esm-browser.js')
	return mod.default || mod
}

/** 页面级稳定 hash（SFC scopeId 用） */
function sfcScopeHash(input: string): string {
	let h = 5381
	for (let i = 0; i < input.length; i++) h = ((h << 5) + h) ^ input.charCodeAt(i)
	return (h >>> 0).toString(36)
}

/** 把 SFC 产物中 from 'vue' 的导入改写为从 window.Vue 解构（运行时 Vue 由 CDN 全局注入） */
function rewriteVueImports(code: string): string {
	return code
		.replace(/import\s+\*\s+as\s+(\w+)\s+from\s+['"]vue['"];?/g, 'const $1 = window.Vue;')
		.replace(/import\s+(\w+)\s+from\s+['"]vue['"];?/g, 'const $1 = window.Vue;')
		.replace(/import\s*\{([^}]+)\}\s*from\s+['"]vue['"];?/g, (_m, spec: string) => {
			const parts = spec
				.split(',')
				.map((s: string) => s.trim())
				.filter(Boolean)
				.map((item: string) => {
					const alias = item.match(/^(\w+)\s+as\s+(\w+)$/)
					return alias ? `${alias[1]}: ${alias[2]}` : item
				})
			return `const { ${parts.join(', ')} } = window.Vue;`
		})
}

/** 编译前校验：SFC 脚本里只允许从 'vue' 导入，其余依赖必须用 <!-- @cdn url --> 注释引入 */
function assertNoForeignImports(code: string) {
	const re = /import\s*(?:[\w*][^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g
	const foreign: string[] = []
	let m: RegExpExecArray | null
	while ((m = re.exec(code))) {
		if (m[1] !== 'vue') foreign.push(m[1])
	}
	if (foreign.length) {
		throw new Error(
			`Vue 页面仅允许从 'vue' 导入，发现不支持的依赖：${[...new Set(foreign)].join('、')}。` +
				`第三方库请在文件顶部用 <!-- @cdn https://... --> 注释引入`
		)
	}
}

/**
 * 编译 Vue SFC 源码为可注入的 IIFE。
 * 产物契约与 compileTsx 一致：同步注册 window.__CustomPageRegistry[pageName] = { entry, code }，
 * entry 是一个 React 包装组件——挂载时按需加载 Vue 运行时（以及页面用 <!-- @cdn --> 声明的全部依赖），
 * 然后 createApp 挂载编译后的 SFC。SFC 编译（script/template/style）在此处（浏览器内）完成。
 * 插件注册：IIFE 作用域提供 app（createApp 实例，mount 之前赋值），
 * 页面在 <script setup> 顶层直接写 app.use(ElementPlus) 即可（ElementPlus 由 @cdn 加载为全局变量）。
 */
export async function compileVueSfc(source: string, pageName: string): Promise<CompileResult> {
	const sfc: any = await loadVueSfcCompiler()
	const filename = `${pageName}.vue`
	const scopeHash = sfcScopeHash(pageName)
	const scopeId = `data-v-${scopeHash}`

	const { descriptor, errors } = sfc.parse(source, { filename })
	if (errors && errors.length) {
		throw new Error(`SFC 解析失败：${errors.map((e: any) => e?.message || e).join('；')}`)
	}
	const scoped = descriptor.styles.some((s: any) => s.scoped)

	// ---- script（支持 <script> 与 <script setup>，lang=ts 亦可）----
	let scriptCode = 'const _sfc_main = {};'
	let bindings: any = undefined
	if (descriptor.script || descriptor.scriptSetup) {
		let compiled: any
		try {
			compiled = sfc.compileScript(descriptor, { id: scopeHash })
		} catch (e: any) {
			throw new Error(`脚本编译失败：${e?.message || e}`)
		}
		bindings = compiled.bindings
		assertNoForeignImports(compiled.content)
		scriptCode = rewriteVueImports(compiled.content.replace(/export\s+default/, 'const _sfc_main ='))
	}

	// ---- template → render 函数 ----
	let renderCode = ''
	if (descriptor.template) {
		const tpl = sfc.compileTemplate({
			source: descriptor.template.content,
			filename,
			id: scopeHash,
			scoped,
			compilerOptions: { bindingMetadata: bindings, scopeId: scoped ? scopeId : undefined }
		})
		if (tpl.errors && tpl.errors.length) {
			throw new Error(`模板编译失败：${tpl.errors.map((e: any) => e?.message || e).join('；')}`)
		}
		renderCode = rewriteVueImports(tpl.code.replace(/export\s+function\s+render/, 'function render'))
	}

	// ---- style（scoped 走编译期 scopeId 属性选择器）----
	const cssParts: string[] = []
	for (const style of descriptor.styles) {
		const res = sfc.compileStyle({ source: style.content, filename, id: scopeId, scoped: !!style.scoped })
		if (res.errors && res.errors.length) {
			throw new Error(`样式编译失败：${res.errors.map((e: any) => e?.message || e).join('；')}`)
		}
		cssParts.push(res.code)
	}
	const css = cssParts.join('\n')

	// ---- 运行时依赖：全部由页面自己声明，编译器不做框架猜测 ----
	// vue.global.prod.js 是 SFC 的运行时底座，固定注入；其余（含 UI 框架）都由
	// @cdn 声明：JS 按声明顺序串行、CSS 并行，换其他框架无需改编译器
	const extraCdn = extractCdnUrls(source)

	const cssUrls: string[] = []
	const jsUrls: string[] = [vueRuntimeUrl()]
	for (const u of extraCdn) (/\.css($|\?)/.test(u) ? cssUrls : jsUrls).push(u)

	// ---- 组装组件体（在 __buildSfcComponent 内延迟执行：首次挂载、Vue 就绪后才触碰 window.Vue）----
	const componentBody = [
		scriptCode,
		renderCode,
		descriptor.template ? '_sfc_main.render = render;' : '',
		scoped ? `_sfc_main.__scopeId = ${JSON.stringify(scopeId)};` : '',
		`_sfc_main.__file = ${JSON.stringify(filename)};`,
		'return _sfc_main;'
	]
		.filter(Boolean)
		.join('\n')

	const code = `(function () {
  var PAGE_NAME = ${JSON.stringify(pageName)};
  var CSS_URLS = ${JSON.stringify(cssUrls)};
  var JS_URLS = ${JSON.stringify(jsUrls)};
  var SFC_CSS = ${JSON.stringify(css)};
  // createApp 实例：在 __CustomPageEntry 挂载时赋值（mount 之前），
  // SFC 的 <script setup> 顶层可直接 app.use(插件) 注册第三方插件
  var app = null;

  function __buildSfcComponent() {
${componentBody}
  }

  // 资源加载：全局 promise 缓存（幂等 + 防并发竞态），失败清除缓存允许重试
  function __loadAsset(url) {
    var w = window;
    var loader = (w.__CuiVueAssetLoader = w.__CuiVueAssetLoader || {});
    if (loader[url]) return loader[url];
    loader[url] = new Promise(function (resolve, reject) {
      var isCss = /\\.css($|\\?)/.test(url);
      var el = document.createElement(isCss ? 'link' : 'script');
      if (isCss) { el.rel = 'stylesheet'; el.href = url; } else { el.src = url; }
      el.onload = resolve;
      el.onerror = function () { reject(new Error('CDN 资源加载失败：' + url)); };
      document.head.appendChild(el);
    });
    loader[url].catch(function () { delete loader[url]; });
    return loader[url];
  }

  // 页面设置里配置的组件库（宿主在挂载前写入 window.__CustomPageLibraries）。
  // 必须在 Vue 之后按序加载：Element Plus / Vant 等 UMD 包在全局分支里依赖 window.Vue。
  function __pageLibs() {
    var libs = window.__CustomPageLibraries || {};
    return {
      css: Object.prototype.toString.call(libs.css) === '[object Array]' ? libs.css : [],
      js: Object.prototype.toString.call(libs.js) === '[object Array]' ? libs.js : []
    };
  }

  function __loadVueRuntime() {
    var w = window;
    var pageLibs = __pageLibs();
    CSS_URLS.concat(pageLibs.css).forEach(function (u) { __loadAsset(u).catch(function () {}); });
    // Monaco 的全局 AMD loader（window.define.amd）会劫持 Element Plus 等 UMD 库走 define 分支，
    // 导致 window.ElementPlus 永远为空——加载期间临时屏蔽 define，结束后恢复。
    // __CuiVueDefineCleared 防止两个 Vue 页面并发加载时互相把对方的原始 define 覆盖成 undefined。
    var cleared = false;
    if (typeof w.define === 'function' && w.define.amd && !w.__CuiVueDefineCleared) {
      w.__CuiVueOriginalDefine = w.define;
      w.define = undefined;
      w.__CuiVueDefineCleared = true;
      cleared = true;
    }
    var restore = function () {
      if (cleared) {
        w.define = w.__CuiVueOriginalDefine;
        w.__CuiVueDefineCleared = false;
        cleared = false;
      }
    };
    var chain = Promise.resolve();
    JS_URLS.concat(pageLibs.js).forEach(function (u) { chain = chain.then(function () { return __loadAsset(u); }); });
    return chain.then(function () {
      restore();
      if (!w.Vue) throw new Error('Vue 运行时加载失败（window.Vue 为空）');
    }, function (e) { restore(); throw e; });
  }

  var __CustomPageEntry = function VueSfcPage(props) {
    var React = (window[${JSON.stringify(CUSTOM_RUNTIME)}] || {}).React;
    var containerRef = React.useRef(null);
    var errState = React.useState('');
    var err = errState[0];
    var setErr = errState[1];
    React.useEffect(function () {
      app = null;
      var styleEl = null;
      var alive = true;
      __loadVueRuntime()
        .then(function () {
          if (!alive || !containerRef.current) return;
          try {
            if (SFC_CSS) {
              styleEl = document.createElement('style');
              styleEl.setAttribute('data-vue-page', PAGE_NAME);
              styleEl.textContent = SFC_CSS;
              document.head.appendChild(styleEl);
            }
            app = window.Vue.createApp(__buildSfcComponent(), props || {});
            app.mount(containerRef.current);
          } catch (e) {
            if (alive) setErr(String((e && e.message) || e));
          }
        })
        .catch(function (e) {
          if (alive) setErr(String((e && e.message) || e));
        });
      return function () {
        alive = false;
        try { if (app) app.unmount(); } catch (e) {}
        app = null;
        if (styleEl) styleEl.remove();
      };
    }, []);
    if (err) {
      return React.createElement('div', { style: { padding: 24, color: '#f56c6c' } }, 'Vue 页面加载失败：' + err);
    }
    return React.createElement('div', { ref: containerRef, style: { width: '100%', minHeight: '200px' } });
  };

  window[${JSON.stringify(CUSTOM_REGISTRY)}] = window[${JSON.stringify(CUSTOM_REGISTRY)}] || {};
  window[${JSON.stringify(CUSTOM_REGISTRY)}][PAGE_NAME] = {
    entry: typeof __CustomPageEntry === 'undefined' ? null : __CustomPageEntry,
    code: ${JSON.stringify(componentBody)}
  };
})();
//# sourceURL=custompage://${pageName}.vue.js
`

	return { code, entry: DEFAULT_ENTRY }
}

/** 产物是否为旧 IIFE 格式（带注册表标记） */
export function isLegacyIiife(code: string): boolean {
	return code.includes(CUSTOM_REGISTRY) || code.includes('__CustomPageEntry')
}

/** 产物是否为 Vue SFC 页面（自带 Vue 运行时加载器，组件库需由它排在 Vue 之后加载） */
export function isVueSfcBundle(code: string): boolean {
	return code.includes('__CuiVueAssetLoader')
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
	const cdnUrls = extractCdnUrls(source)

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
  // 页面顶部的 @cdn 声明（// @cdn url 或 /* @cdn url */）：渲染前按声明顺序加载，
  // CSS 并行、JS 串行；加载完再渲染页面组件，与 Vue SFC 的 <!-- @cdn --> 同语义。
  // 页面设置里勾选的组件组由宿主在本脚本注入前加载，此处只处理页面自带声明。
  var __CDN_URLS = ${JSON.stringify(cdnUrls)};
  if (__CDN_URLS.length && __CustomPageEntry) {
    var __PageEntry = __CustomPageEntry;
    __CustomPageEntry = function __CdnGate(props) {
      var readyState = useState(false);
      var errState = useState('');
      var ready = readyState[0], setReady = readyState[1];
      var cdnErr = errState[0], setCdnErr = errState[1];
      useEffect(function () {
        var alive = true;
        loadCdn(__CDN_URLS).then(function () {
          if (alive) setReady(true);
        }, function (e) {
          if (alive) setCdnErr(String((e && e.message) || e));
        });
        return function () { alive = false; };
      }, []);
      if (cdnErr) return React.createElement('div', { style: { padding: 24, color: '#f56c6c' } }, '@cdn 资源加载失败：' + cdnErr);
      if (!ready) return null;
      return React.createElement(__PageEntry, props);
    };
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

// ============================== 源码格式化（prettier，按需加载） ==============================

/** 格式化模式：react（JS/JSX/TSX）、vue（单文件组件）、json（DSL 页面） */
export type FormatMode = 'react' | 'vue' | 'json'

/** 取 CJS/ESM 动态导入的模块真身 */
function unwrapModule(mod: any): any {
	return mod && mod.default ? mod.default : mod
}

/**
 * 格式化高级页面源码。
 * prettier（含各语言解析器）体积大，全部动态 import，不进主包：
 * - react：typescript 解析器，同时覆盖 JS / TS / JSX / TSX
 * - vue：html + postcss + babel + typescript 解析器（template/script/style 三块）
 * - json：babel 解析器自带的 json 解析
 */
export async function formatPageCode(source: string, mode: FormatMode = 'react'): Promise<string> {
	const prettier = unwrapModule(await import('prettier/standalone'))
	const plugins: any[] = []

	if (mode === 'vue') {
		const [html, postcss, babel, typescript] = await Promise.all([
			import('prettier/parser-html'),
			import('prettier/parser-postcss'),
			import('prettier/parser-babel'),
			import('prettier/parser-typescript')
		])
		plugins.push(unwrapModule(html), unwrapModule(postcss), unwrapModule(babel), unwrapModule(typescript))
	} else if (mode === 'json') {
		plugins.push(unwrapModule(await import('prettier/parser-babel')))
	} else {
		plugins.push(unwrapModule(await import('prettier/parser-typescript')))
	}

	const parser = mode === 'vue' ? 'vue' : mode === 'json' ? 'json' : 'typescript'
	return prettier.format(source, {
		parser,
		plugins,
		printWidth: 120,
		tabWidth: 2,
		useTabs: false,
		semi: true,
		singleQuote: true
	})
}