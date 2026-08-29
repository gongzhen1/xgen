import type { FormItemProps } from 'antd'

export interface IProps extends FormItemProps {
	__bind: string
	__name: string
	itemProps?: FormItemProps

	value?: string
	onChange?: (value: string) => void

	scripts?: { api: string; params?: Record<string, any>; labelField?: string; valueField?: string }
	methods?: { api: string; params?: Record<string, any>; labelField?: string; valueField?: string }
	scriptParam?: string
	prefix?: string
	separator?: string
	disabled?: boolean
}

export interface ICustom {
	__name: string
	value?: string
	onChange?: (value: string) => void

	scripts?: IProps['scripts']
	methods?: IProps['methods']
	scriptParam?: string
	prefix?: string
	separator?: string
	disabled?: boolean
}

export interface ScriptOption {
	label: string
	value: string
	[key: string]: any
}