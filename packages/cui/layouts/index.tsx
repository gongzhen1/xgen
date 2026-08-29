import '@/styles/index.less'

import { ConfigProvider } from 'antd'
import { observer } from 'mobx-react-lite'
import { useEffect, useLayoutEffect, useState } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { container } from 'tsyringe'

import { GlobalContext, GlobalModel } from '@/context/app'
import { useIntl } from '@/hooks'
import { history, Outlet, useLocation } from '@umijs/max'

import Helmet from './components/Helmet'
import LoginWrapper from './wrappers/Login'
import AuthWrapper from './wrappers/Auth'
import AdminWrapper from './wrappers/Admin'
import ChatboxWrapper from './wrappers/Chatbox'

import type { IPropsHelmet, IPropsLoginWrapper } from './types'

// Standalone pages that render without wrappers (OAuth, invitations, etc.)
const STANDALONE_PAGES = new Map([
	// OAuth authentication pages
	['auth_entry', '/auth/entry'], // Unified login/register entry point
	['auth_entry_mfa', '/auth/entry/mfa'], // MFA verification
	['auth_entry_invite', '/auth/entry/invite'], // Invitation code verification
	['auth_device', '/auth/device'], // Device authorization (RFC 8628)
	['auth_logout', '/auth/logout'],
	['auth_back', '/auth/back/'],
	['auth_consent', '/auth/consent'],
	['auth_helloworld', '/auth/helloworld'],
	// Team pages
	['team_select', '/team/select'],
	['team_invite', '/team/invite/'],
	// OTP verification
	['otp_verify', '/v/'],
	// Lowcode studio standalone pages
])

// Cache route list once to avoid rebuilding on every render
const STANDALONE_ROUTES = Array.from(STANDALONE_PAGES.values())

const CHATDEV_PREFIX = '/chatdev'

// Check if current path matches any standalone page
const isStandalonePage = (pathname: string): boolean => {
	// Check for trace view mode: /trace/{id}/view
	if (pathname.startsWith('/trace/') && pathname.endsWith('/view')) {
		return true
	}

	return STANDALONE_ROUTES.some((route) => {
		// For routes ending with '/', use startsWith (e.g., /auth/back/, /team/invite/)
		if (route.endsWith('/')) {
			return pathname.startsWith(route)
		}
		// For exact routes, use strict equality
		return pathname === route
	})
}

// Safe localStorage read (privacy mode / SSR may throw)
const hasMenuCache = (): boolean => {
	try {
		return Boolean(localStorage.getItem('xgen:menu'))
	} catch {
		return false
	}
}

const Index = () => {
	const messages = useIntl()
	const [global] = useState(() => container.resolve(GlobalModel))
	const [isInitialLoad, setIsInitialLoad] = useState(true)
	const { pathname, search } = useLocation()
	const isLogin = pathname.includes('/login/') || pathname === '/'
	const isAuth = pathname === '/auth'
	const isStandalone = isStandalonePage(pathname)
	const isChatdev = pathname.startsWith(CHATDEV_PREFIX)
	const hideMenu = new URLSearchParams(search).get('__hidemenu') === '1'

	// Trigger menu fetch when cache is missing (side effect, moved out of render)
	useEffect(() => {
		if (!hasMenuCache()) {
			window.$app.Event.emit('app/getUserMenu')
		}
	}, [])

	useLayoutEffect(() => {
		window.$global = global

		global.locale_messages = messages
		global.on()
		global.stack.on()

		return () => {
			global.off()
			global.stack.off()
		}
	}, [])

	useLayoutEffect(() => {
		global.visible_menu = true
		global.hide_nav = hideMenu
		global.stack.reset()

		// Chat Layout
		if (global.layout === 'Chat') {
			if (pathname === '/chat' || pathname === '/chat/' || isChatdev) {
				global.setSidebarVisible(false)
			}
		}

		// 基于路由的侧边栏控制 - 仅在首次加载时生效
		if (isInitialLoad && global.layout === 'Chat') {
			if (pathname.startsWith('/settings/')) {
				// /settings/* 路由：最大化侧边栏
				global.updateSidebarState(true, true, window.innerWidth - 40)
			} else if (pathname !== '/' && !isLogin && !isAuth) {
				// 其他路由：显示默认宽度侧边栏
				const screenWidth = window.innerWidth
				const defaultWidth = Math.min(screenWidth * 0.618, screenWidth - 320)
				global.updateSidebarState(true, false, defaultWidth)
			}
			// 标记首次加载已完成
			setIsInitialLoad(false)
		}
	}, [pathname, global.layout, isInitialLoad, hideMenu, isLogin, isAuth, isChatdev, global])

	const propsHelmet: IPropsHelmet = {
		theme: global.theme,
		app_info: global.app_info
	}

	const propsLoginWrapper: IPropsLoginWrapper = {
		logo: global.app_info?.logo,
		admin: global.app_info?.login?.admin,
		user: global.app_info?.login?.user
	}

	// Redirect legacy login pages to /auth/entry when OpenAPI is enabled
	useEffect(() => {
		if (isLogin && global.isOpenAPIEnabled) {
			history.push('/auth/entry')
		}
	}, [isLogin, global.isOpenAPIEnabled])

	const renderMainContent = () => {
		// Standalone pages (OAuth, invitations, etc.) - render without wrappers
		if (isStandalone) {
			return <Outlet />
		}

		if (isLogin) {
			// When OpenAPI is enabled, don't render the legacy login wrapper
			if (global.isOpenAPIEnabled) return null

			return (
				<LoginWrapper {...propsLoginWrapper}>
					<Outlet />
				</LoginWrapper>
			)
		}

		if (isAuth) {
			return (
				<AuthWrapper {...propsLoginWrapper}>
					<Outlet />
				</AuthWrapper>
			)
		}

		// Force ChatboxWrapper for /chatdev route regardless of global.layout
		if (isChatdev) {
			return (
				<ChatboxWrapper>
					<Outlet />
				</ChatboxWrapper>
			)
		}

		if (global.layout === 'Chat') {
			return (
				<ChatboxWrapper>
					<Outlet />
				</ChatboxWrapper>
			)
		}

		return (
			<AdminWrapper>
				<Outlet />
			</AdminWrapper>
		)
	}
	return (
		<HelmetProvider>
			<Helmet {...propsHelmet} />
			<ConfigProvider prefixCls='xgen'>
				<GlobalContext.Provider value={global}>{renderMainContent()}</GlobalContext.Provider>
			</ConfigProvider>
		</HelmetProvider>
	)
}

export default new window.$app.Handle(Index).by(observer).get()
