import type { Component } from '@/types'

/**
 * 远程选项请求配置，与 Select 组件中的 `xProps.remote` 保持一致的结构。
 * `api` 为已解析好的后端接口地址，`params` 为查询参数。
 */
export interface ScriptMethodRequest extends Component.Request {
	/**
	 * 选项列表中作为显示文本的字段名，默认为 `label`。
	 */
	labelField?: string
	/**
	 * 选项列表中作为值的字段名，默认为 `value`。
	 */
	valueField?: string
}

/**
 * 脚本处理器选择组件 Props。
 *
 * 组件内部包含两个联动的 Select（脚本 / 方法），最终拼接为形如
 * `scripts.<script_id>.<method>` 的处理器字符串并写回 `bind` 字段。
 */
export interface IProps extends Component.PropsEditComponent {
	/**
	 * 脚本列表的远程请求配置（必填）。
	 */
	scripts?: ScriptMethodRequest
	/**
	 * 方法列表的远程请求配置（必填）。
	 */
	methods?: ScriptMethodRequest
	/**
	 * 加载方法列表时，用于传递「已选脚本 id」的参数名，默认为 `id`。
	 */
	scriptParam?: string
	/**
	 * 处理器字符串前缀，默认为 `scripts.`。
	 */
	prefix?: string
	/**
	 * 脚本 id 与方法之间的分隔符，默认为 `.`。
	 */
	separator?: string
	/**
	 * 是否禁用。
	 */
	disabled?: boolean
}

/**
 * 传递给内部受控渲染组件的 Props，`value` / `onChange` 由外层 Form.Item 注入。
 */
export interface ICustom {
	value?: string
	onChange?: (value: string) => void
	scripts?: ScriptMethodRequest
	methods?: ScriptMethodRequest
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