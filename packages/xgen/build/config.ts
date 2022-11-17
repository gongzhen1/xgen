import type Config from 'webpack-chain'

export const env = process.env.NODE_ENV as 'development' | 'production'

export const base = `/${process.env.BASE}/`

export const proxy = {
	'/api': {
		target: 'http://local.iqka.com:5099',
		changeOrigin: true
	},
	'/extend': {
		target: 'http://local.iqka.com:5099',
		changeOrigin: true
	},
	'/assets': {
		target: 'http://local.iqka.com:5099',
		changeOrigin: true
	},
	'/iframe': {
		target: 'http://local.iqka.com:5099',
		changeOrigin: true
	}
}

export const conventionRoutes = {
	exclude: [
		/model\.(j|t)sx?$/,
		/services\.(j|t)sx?$/,
		/types\.(j|t)sx?$/,
		/hooks\.(j|t)sx?$/,
		/locales\.(j|t)sx?$/,
		/components\//,
		/hooks\//,
		/locales\//
	]
}

export const links = [
	{ rel: 'preload', href: `/${process.env.BASE}/icon_font.css` },
	{ rel: 'preload', href: `/${process.env.BASE}/theme/light.css` },
	{ rel: 'stylesheet', href: `/${process.env.BASE}/icon_font.css` },
	{ rel: 'stylesheet', href: `/${process.env.BASE}/theme/light.css` }
]

export const chainWebpack = (config: Config) => {
	const reg_shadowcss = /\.sss$/
	const reg_shadowless = /\.lsss$/

	config.module.rule('asset').exclude.add(reg_shadowcss).end().exclude.add(reg_shadowless).end()

	config.module
		.rule('shadowcss')
		.test(reg_shadowcss)
		.exclude.add(/node_modules/)
		.end()
		.use('raw-loader')
		.loader('raw-loader')
		.end()

	config.module
		.rule('shadowless')
		.test(reg_shadowless)
		.exclude.add(/node_modules/)
		.end()
		.use('raw-loader')
		.loader('raw-loader')
		.end()
		.use('less-loader')
		.loader('less-loader')
		.end()
}

export const extraBabelPlugins = ['babel-plugin-transform-typescript-metadata']
