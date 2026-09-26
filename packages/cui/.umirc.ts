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
	locale: { default: 'zh-CN', antd: true, baseNavigator: true },
	conventionRoutes,
	define: { $runtime: { BASE: process.env.BASE } },
	// @ts-ignore
	chainWebpack
})
