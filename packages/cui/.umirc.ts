import { defineConfig } from '@umijs/max'

import { base, chainWebpack, conventionRoutes, links, metas, proxy, srcTranspilerOptions } from './build/config'

export default defineConfig({
	// MFSU 4.0 的依赖拦截与 React 19 的 exports 条件入口不兼容
	// （react-dom/client 会被误指向主入口，丢失 createRoot/hydrateRoot），关闭后走 webpack 原生解析
	mfsu: false,
	srcTranspiler: 'swc',
	srcTranspilerOptions,
	jsMinifier: 'swc',
	npmClient: 'pnpm',
	base,
	publicPath: base,
	proxy,
	links,
	metas,
	test: false,
	valtio: false,
	antd: { import: true, style: undefined },
	codeSplitting: { jsStrategy: 'granularChunks' },
	// baseNavigator 关闭：不跟随浏览器语言（英文环境浏览器会把 antd 组件渲染成英文），默认锁定 zh-CN；
	// 手动切换语言（写入 localStorage.umi_locale）仍然生效
	locale: { default: 'zh-CN', antd: true, baseNavigator: false },
	conventionRoutes,
	define: { $runtime: { BASE: process.env.BASE } },
	// @ts-ignore
	chainWebpack
})
