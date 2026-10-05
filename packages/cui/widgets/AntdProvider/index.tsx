import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd'
import en_US from 'antd/locale/en_US'
import zh_CN from 'antd/locale/zh_CN'

import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { getLocale } from '@umijs/max'
import { useMemo, useState } from 'react'
import { container } from 'tsyringe'

import { GlobalModel } from '@/context/app'

import type { PropsWithChildren } from 'react'

// antd 6：less 变量主题废弃，改用 token + algorithm；prefixCls 保留 xgen 兼容既有 css 覆盖
const Index = ({ children, theme }: PropsWithChildren<{ theme?: string }>) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// antd 6 日历面板的月份/星期表头由 dayjs 渲染（ConfigProvider locale 不覆盖这部分），
	// 需注册 dayjs zh-cn locale 并设置全局 locale，否则显示英文 Oct / Su Mo Tu
	dayjs.locale(is_cn ? 'zh-cn' : 'en')
	const [global] = useState(() => container.resolve(GlobalModel))
	const is_dark = (theme ?? global?.theme ?? window.$global?.theme) === 'dark'

	const themeConfig = useMemo(
		() => ({
			algorithm: is_dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
			token: {
				colorPrimary: '#3371fc', // 对齐 antd4 @primary-color
				controlHeight: 38, // 对齐 antd4 @height-base（Select 等高度）
				borderRadius: 6, // 对齐 antd4 @border-radius-base
				borderRadiusLG: 6, // 对齐 antd4 dropdown/modal 等大圆角
				colorBgContainerDisabled: is_dark ? 'rgba(255,255,255,0.04)' : '#f0f0f0', // 对齐 antd4 @disabled-bg
				boxShadowSecondary: '4px 4px 40px rgba(0, 0, 0, 0.05)', // 对齐 antd4 弹层阴影
				colorText: is_dark ? '#a2a5b9' : '#111111', // 对齐 antd4 @text-color（暗色 #a2a5b9 / 亮色 #111）
				colorBorder: is_dark ? '#404046' : '#d9d9d9' // 对齐 antd4 @border-color-base
			},
			components: {
				// 对齐 antd4 的表格视觉：表头灰底、文字弱化、悬停底色
				// 注：表格容器透明（原 antd4 @table-bg: transparent）由 styles/preset/antd.less 的 .xgen-table{background:transparent} 实现
				Table: {
					headerBg: is_dark ? 'rgba(255,255,255,0.04)' : '#f0f0f0',
					headerColor: is_dark ? 'rgba(255,255,255,0.65)' : 'rgba(0, 0, 0, 0.65)',
					rowHoverBg: is_dark ? 'rgba(255,255,255,0.04)' : '#f5f5f5'
				},
				// Menu：选中项背景/文字色（亮色 #f7f7f7/#3371fc、暗色 #111/#4580ff）、菜单项无圆角、高度 40px
				// itemMarginInline:0 使选中项宽度铺满菜单；activeBarWidth:3 显示右侧蓝色指示条（对齐 antd4）
				Menu: {
					itemSelectedBg: is_dark ? '#111111' : '#f7f7f7',
					itemSelectedColor: is_dark ? '#4580ff' : '#3371fc',
					itemBorderRadius: 0,
					itemHeight: 40,
					itemMarginInline: 0,
					activeBarWidth: 3
				},
				// Input：背景（亮色 #f9f9f9 / 暗色 #232326）、padding 7px 使高度 36px
				Input: {
					colorBgContainer: is_dark ? '#232326' : '#f9f9f9',
					paddingBlock: 7
				},
				// Select：背景同 Input；聚焦 outline 色对齐 antd4
				Select: {
					colorBgContainer: is_dark ? '#232326' : '#f9f9f9',
					activeOutlineColor: 'rgba(51, 113, 252, 0.2)'
				}
			}
		}),
		[is_dark]
	)

	return (
		<ConfigProvider prefixCls='xgen' locale={is_cn ? zh_CN : en_US} theme={themeConfig}>
			{/* App 提供 message/notification/Modal 上下文，静态方法在 antd 6 下依然可用 */}
			<AntdApp>{children}</AntdApp>
		</ConfigProvider>
	)
}

export default window.$app.memo(Index)
