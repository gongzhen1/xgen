import { observer } from 'mobx-react-lite'
import { useEffect, useMemo, useState } from 'react'
import { Select } from 'antd'
import axios from 'axios'

import { Item } from '@/components'
import { getLocale } from '@umijs/max'

import type { ICustom, IProps, ScriptOption } from './types'
import type { SelectProps } from 'antd'

const DEFAULT_PREFIX = 'scripts.'
const DEFAULT_SEPARATOR = '.'

/**
 * 将后端返回的选项数据归一化为 `[{ label, value }]`。
 * 兼容 `string[]`、`[label, value][]`、`{label, value}` 等多种结构。
 */
const normalizeOptions = (data: any, labelField?: string, valueField?: string): ScriptOption[] => {
	if (!Array.isArray(data)) return []

	const labelKey = labelField || 'label'
	const valueKey = valueField || 'value'

	return data
		.map((item): ScriptOption | null => {
			if (typeof item === 'string') return { label: item, value: item }
			if (Array.isArray(item)) return { label: String(item[0]), value: String(item[1]) }
			if (item && typeof item === 'object') {
				const label = item[labelKey] ?? item.label ?? item.value ?? item.name ?? ''
				const value = item[valueKey] ?? item.value ?? item.label ?? ''
				return { ...item, label: String(label), value: String(value) }
			}
			return null
		})
		.filter((item): item is ScriptOption => !!item && item.label !== '')
}

/**
 * 根据处理器字符串反向解析出脚本 id 与方法名。
 * 优先在已知脚本选项里做最长前缀匹配，避免脚本 id 本身含 `.` 时解析错误。
 */
const splitProcessor = (
	value: string,
	prefix: string,
	separator: string,
	scriptOptions: ScriptOption[]
): { script: string; method: string } | null => {
	if (!value) return null

	const rest = value.startsWith(prefix) ? value.slice(prefix.length) : value

	const known = scriptOptions.map((option) => option.value).sort((a, b) => b.length - a.length)
	for (const id of known) {
		if (rest === id) return { script: id, method: '' }
		if (rest.startsWith(`${id}${separator}`)) {
			return { script: id, method: rest.slice(id.length + separator.length) }
		}
	}

	// 兜底：方法名为最后一个分隔符之后的内容（方法名不含 `.`）。
	const index = rest.lastIndexOf(separator)
	if (index === -1) return { script: rest, method: '' }
	return { script: rest.slice(0, index), method: rest.slice(index + separator.length) }
}

const Custom = window.$app.memo((props: ICustom) => {
	const {
		value,
		onChange,
		scripts,
		methods,
		scriptParam = 'id',
		prefix = DEFAULT_PREFIX,
		separator = DEFAULT_SEPARATOR,
		disabled
	} = props

	const is_cn = getLocale() === 'zh-CN'

	const [script, setScript] = useState<string>()
	const [method, setMethod] = useState<string>()
	const [scriptOptions, setScriptOptions] = useState<ScriptOption[]>([])
	const [methodOptions, setMethodOptions] = useState<ScriptOption[]>([])
	const [loadingScripts, setLoadingScripts] = useState(false)
	const [loadingMethods, setLoadingMethods] = useState(false)

	const scriptsParams = useMemo(() => JSON.stringify(scripts?.params || {}), [scripts])

	// 加载脚本列表
	useEffect(() => {
		if (!scripts?.api) return
		setLoadingScripts(true)
		axios
			.get<any, any>(scripts.api, { params: scripts.params })
			.then((res) => setScriptOptions(normalizeOptions(res, scripts.labelField, scripts.valueField)))
			.catch((err) => console.error('[ScriptProcess] fetch scripts error', err))
			.finally(() => setLoadingScripts(false))
	}, [scripts?.api, scriptsParams])

	// 脚本变更时加载方法列表
	useEffect(() => {
		if (!script) {
			setMethodOptions([])
			return
		}

		if (!methods?.api) return
		setLoadingMethods(true)
		axios
			.get<any, any>(methods.api, { params: { ...methods.params, [scriptParam]: script } })
			.then((res) => setMethodOptions(normalizeOptions(res, methods.labelField, methods.valueField)))
			.catch((err) => console.error('[ScriptProcess] fetch methods error', err))
			.finally(() => setLoadingMethods(false))
	}, [script, methods?.api, scriptParam])

	// 外部值（编辑态回填）变化时，反向解析出脚本与方法
	useEffect(() => {
		const current = script && method ? `${prefix}${script}${separator}${method}` : ''
		if (value === current) return

		if (!value) {
			setScript(undefined)
			setMethod(undefined)
			return
		}

		const parsed = splitProcessor(value, prefix, separator, scriptOptions)
		if (!parsed) return

		if (parsed.script !== script) setScript(parsed.script)
		if (parsed.method !== method) setMethod(parsed.method)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value])

	// 保证当前已选值在选项中可见（编辑态 options 尚未返回时仍能显示）
	const mergedScriptOptions = useMemo<SelectProps['options']>(() => {
		const options: SelectProps['options'] = scriptOptions.map((option) => ({ label: option.label, value: option.value }))
		if (script && !options.some((option) => option.value === script)) {
			options.unshift({ label: script, value: script })
		}
		return options
	}, [scriptOptions, script])

	const mergedMethodOptions = useMemo<SelectProps['options']>(() => {
		const options: SelectProps['options'] = methodOptions.map((option) => ({ label: option.label, value: option.value }))
		if (method && !options.some((option) => option.value === method)) {
			options.unshift({ label: method, value: method })
		}
		return options
	}, [methodOptions, method])

	const handleScriptChange = (v: any) => {
		const id = v || undefined
		setScript(id)
		setMethod(undefined)
		onChange?.('')
	}

	const handleMethodChange = (v: any) => {
		const name = v || undefined
		setMethod(name)
		onChange?.(script && name ? `${prefix}${script}${separator}${name}` : '')
	}

	return (
		<div style={{ width: '100%' }}>
			<div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 8 }}>
				<Select
					style={{ flex: '3', minWidth: 120, height: 32 }}
					placeholder={is_cn ? '请选择脚本' : 'Select script'}
					loading={loadingScripts}
					value={script}
					options={mergedScriptOptions}
					onChange={handleScriptChange}
					disabled={disabled}
					showSearch
					optionFilterProp='label'
					allowClear
				/>
				<Select
					style={{ flex: '2', minWidth: 120, height: 32 }}
					placeholder={is_cn ? '请选择方法' : 'Select method'}
					loading={loadingMethods}
					value={method}
					options={mergedMethodOptions}
					onChange={handleMethodChange}
					disabled={disabled || !script}
					showSearch
					optionFilterProp='label'
					allowClear
				/>
			</div>
		</div>
	)
})

const Index = (props: IProps) => {
	const { __bind, __name, itemProps, scripts, methods, scriptParam, prefix, separator, disabled, ...rest_props } =
		props

	return (
		<Item {...itemProps} {...{ __bind, __name }}>
			<Custom
				{...rest_props}
				scripts={scripts}
				methods={methods}
				scriptParam={scriptParam}
				prefix={prefix}
				separator={separator}
				disabled={disabled}
			/>
		</Item>
	)
}

export default new window.$app.Handle(Index).by(observer).by(window.$app.memo).get()