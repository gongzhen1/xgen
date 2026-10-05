import { Button, Checkbox, Input, Select, Tooltip } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import Item from '../Item'
import { getLocale } from '@umijs/max'

import styles from './index.less'

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select'

export interface FieldItem {
	key: string
	label: string
	type: FieldType
	required: boolean
	options?: string[]
}

export interface IProps {
	value?: FieldItem[] | null
	onChange?: (value: FieldItem[]) => void
	__name: string
}

const OPTIONS_TYPE = [
	{ label: '文本', value: 'text' },
	{ label: '多行文本', value: 'textarea' },
	{ label: '数字', value: 'number' },
	{ label: '日期', value: 'date' },
	{ label: '下拉选择', value: 'select' },
]

const KEY_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

// 行 key 仅在创建时生成一次（新增行 / 回填补齐缺失 key），重渲染不重新生成
function genKey() {
	let s = ''
	for (let i = 0; i < 5; i++) {
		s += KEY_CHARS[Math.floor(Math.random() * KEY_CHARS.length)]
	}
	return `f_${s}`
}

function normalize(value?: FieldItem[] | null): FieldItem[] {
	if (!Array.isArray(value)) return []
	return value.map((it) => ({ key: it?.key || genKey(), ...it }))
}

const Index = (props: IProps) => {
	const { value, onChange, __name, ...rest } = props
	const is_cn = getLocale() === 'zh-CN'

	const [fields, setFields] = useState<FieldItem[]>(() => normalize(value))

	const handleChange = (next: FieldItem[]) => {
		setFields(next)
		onChange?.(next)
	}

	const patchField = (key: string, patch: Partial<FieldItem>) => {
		handleChange(fields.map((it) => (it.key === key ? { ...it, ...patch } : it)))
	}

	// 切换类型时保持数据干净：select 补 options，其他类型移除 options
	const handleTypeChange = (key: string, type: FieldType) => {
		handleChange(
			fields.map((it) => {
				if (it.key !== key) return it
				if (type === 'select') {
					return { ...it, type, options: Array.isArray(it.options) ? it.options : [] }
				}
				const next = { ...it, type }
				delete next.options
				return next
			})
		)
	}

	const handleAdd = () => {
		handleChange([...fields, { key: genKey(), label: '', type: 'text', required: false }])
	}

	const handleRemove = (key: string) => {
		handleChange(fields.filter((it) => it.key !== key))
	}

	const commonSelectProps: any = {
		popupClassName: 'xgen-select-dropdown',
		getPopupContainer: (node: any) => node.parentNode,
		notFoundContent: is_cn ? '无数据' : 'No data',
	}

	return (
		<Item __name={__name} __bind='form_fields_config'>
			<div className={styles._local}>
				<div className='ff-list'>
					{fields.map((it) => (
						<div className='ff-item' key={it.key}>
							<div className='ff-row'>
								<Input
									className='ff-input'
									size='small'
									placeholder={is_cn ? '字段名称' : 'Field name'}
									value={it.label}
									onChange={(e) => patchField(it.key, { label: e.target.value })}
								/>
								<Select
									className='ff-type'
									size='small'
									{...commonSelectProps}
									options={OPTIONS_TYPE}
									value={it.type}
									onChange={(v) => handleTypeChange(it.key, v as FieldType)}
								/>
								<Checkbox
									className='ff-required'
									checked={it.required}
									onChange={(e) => patchField(it.key, { required: e.target.checked })}
								>
									{is_cn ? '必填' : 'Required'}
								</Checkbox>
								<Tooltip title={is_cn ? '删除' : 'Delete'}>
									<Button
										className='ff-del'
										size='small'
										type='text'
										icon={<DeleteOutlined />}
										onClick={() => handleRemove(it.key)}
									/>
								</Tooltip>
							</div>
							{it.type === 'select' && (
								<Select
									className='ff-options'
									size='small'
									mode='tags'
									open={false}
									tokenSeparators={[',']}
									{...commonSelectProps}
									placeholder={is_cn ? '输入选项后回车' : 'Type then press Enter'}
									value={Array.isArray(it.options) ? it.options : []}
									onChange={(vals) => patchField(it.key, { options: vals as string[] })}
								/>
							)}
						</div>
					))}
				</div>
				<Button className='ff-add' size='small' dashed block icon={<PlusOutlined />} onClick={handleAdd}>
					{is_cn ? '添加字段' : 'Add field'}
				</Button>
			</div>
		</Item>
	)
}

export default window.$app.memo(Index)
