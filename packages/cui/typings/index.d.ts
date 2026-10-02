declare module '*.css'
declare module '*.sss'
declare module '*.less'
declare module '*.lsss'
declare module '*.png'
declare module '*.svg'
declare module '*.jpeg'
declare module 'less-vars-to-js'

// prettier 2.x 未随包提供 standalone/parser 子路径的类型声明，这里按最小可用签名补齐
declare module 'prettier/standalone' {
	export interface Options {
		parser?: string
		plugins?: unknown[]
		[key: string]: unknown
	}
	export function format(source: string, options?: Options): string
	export function formatWithCursor(source: string, options?: Options): { formatted: string }
}

declare module 'prettier/parser-babel'
declare module 'prettier/parser-html'
declare module 'prettier/parser-postcss'
declare module 'prettier/parser-typescript'

interface Window {
	$app: $App
}
