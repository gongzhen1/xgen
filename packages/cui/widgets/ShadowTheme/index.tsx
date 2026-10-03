import { useLayoutEffect, useRef, useState } from 'react'
import { Else, If, Then } from 'react-if'
import { container } from 'tsyringe'

import { GlobalModel } from '@/context/app'
import dark_theme from '@/public/theme/dark.sss'
import light_theme from '@/public/theme/light.sss'

const Index = () => {
	const [global] = useState(() => container.resolve(GlobalModel))
	const styleRef = useRef<HTMLStyleElement>(null)

	const isDark = (global?.theme || window.$global?.theme) === 'dark'

	// 在 shadow host 上标记当前主题，供注入 shadow 的自定义补丁
	// （如 common.lsss 中 antd v6 Select 新 DOM 兼容样式）区分明暗色板。
	// ShadowTheme 的 <style> 直接挂在 shadowRoot 下，parentNode.host 即宿主元素。
	useLayoutEffect(() => {
		const root = styleRef.current?.parentNode as ShadowRoot | null
		const host = root?.host
		if (host) host.setAttribute('data-theme', isDark ? 'dark' : 'light')
	}, [isDark])

	return (
		<If condition={isDark}>
			<Then>
				<style id='xgen-theme' ref={styleRef}>{dark_theme}</style>
			</Then>
			<Else>
				<style id='xgen-theme' ref={styleRef}>{light_theme}</style>
			</Else>
		</If>
	)
}

export default window.$app.memo(Index)
