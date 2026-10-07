import { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Form, Input, Modal, Radio, Tooltip, message } from 'antd'
import clsx from 'clsx'
import { useMemoizedFn } from 'ahooks'

import { getToken } from '@/knife'
import IconPicker from '@/components/IconPicker'

import styles from './index.less'

type MenuItemType = {
	key?: string
	name?: string
	type?: 'item' | 'group'
	icon?: string
	path?: string
	permission?: string
	children?: MenuItemType[]
}

type MenusDataType = {
	items: MenuItemType[]
	setting: MenuItemType[]
	id: string
}

type FormValues = {
	name?: string
	type?: 'item' | 'group'
	icon?: string
	path?: string
	permission?: string[]
}

type PermissionOption = {
	label: string
	value: string
	group?: string
	extra?: string
}

// 权限点编辑组件：分组标题复选框控制本组（未全选→全选，已全选→清空，部分选中显示半选）
// 作为 Form.Item 直接子元素，仅通过显式调用 onChange 更新字段，避免原生 change 冒泡把字段值覆盖成 "on"
const PermField = ({
	groups,
	value,
	onChange
}: {
	groups: Array<{ group: string; options: PermissionOption[] }>
	value?: string[]
	onChange?: (vals: string[]) => void
}) => {
	const vals = value || []

	// 点击分组标题复选框：未全选则全选本组，已全选则清空本组
	const handleGroupToggle = (groupOptions: PermissionOption[]) => {
		const groupValues = groupOptions.map((o) => o.value)
		const allChecked = groupValues.every((v) => vals.includes(v))
		const set = new Set(vals)
		groupValues.forEach((v) => {
			if (allChecked) {
				set.delete(v)
			} else {
				set.add(v)
			}
		})
		onChange?.(Array.from(set))
	}

	// 组内勾选变化：先移除本组旧值，再合并本组新值，其他组保持不变
	const handleGroupChange = (groupOptions: PermissionOption[], groupVals: string[]) => {
		const groupValues = groupOptions.map((o) => o.value)
		const set = new Set(vals.filter((v) => !groupValues.includes(v)))
		groupVals.forEach((v) => set.add(v))
		onChange?.(Array.from(set))
	}

	return (
		<div className={styles.permCheckboxGroup}>
			{groups.map((g) => {
				const groupValues = g.options.map((o) => o.value)
				const checkedCount = groupValues.filter((v) => vals.includes(v)).length
				const allChecked = checkedCount === groupValues.length
				return (
					<div key={g.group} className={styles.permGroupBlock}>
						<div className={styles.permGroupHeader}>
							<Checkbox
								checked={allChecked}
								indeterminate={checkedCount > 0 && !allChecked}
								onChange={() => handleGroupToggle(g.options)}
							>
								<span className={styles.permGroupTitle}>{g.group}</span>
							</Checkbox>
							<span className={styles.permGroupCount}>
								{checkedCount}/{groupValues.length}
							</span>
						</div>
						<Checkbox.Group
							className={styles.permGroupItems}
							value={groupValues.filter((v) => vals.includes(v))}
							onChange={(checkedVals) => handleGroupChange(g.options, checkedVals as string[])}
						>
							{g.options.map((o) => (
								<Checkbox key={o.value} value={o.value} title={o.extra || o.value}>
									{o.label}
								</Checkbox>
							))}
						</Checkbox.Group>
					</div>
				)
			})}
		</div>
	)
}

const Index = () => {
	const [form] = Form.useForm<FormValues>()
	const [tab, setTab] = useState<'menu' | 'setting'>('menu')
	const [menusData, setMenusData] = useState<MenusDataType>({ items: [], setting: [], id: '' })
	const [selectedKeys, setSelectedKeys] = useState<[string | null, string | null]>([null, null])
	const [action, setAction] = useState<'create' | 'modify'>('create')
	const [icon, setIcon] = useState('')
	const [permOptions, setPermOptions] = useState<PermissionOption[]>([])

	const activeList = tab === 'menu' ? menusData.items : menusData.setting

	// 查询全部权限点选项
	const fetchPermissions = useMemoizedFn(async () => {
		try {
			const token = getToken()
			const resp = await fetch('/api/permission/options', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { authorization: token } : {})
				}
			})
			const data = (await resp.json()) as PermissionOption[]
			setPermOptions(Array.isArray(data) ? data : [])
		} catch {
			setPermOptions([])
		}
	})

	useEffect(() => {
		fetchPermissions()
	}, [])

	// 权限点按分组聚合展示
	const permGroups = useMemo(() => {
		if (!permOptions.length) return []
		const map: Record<string, PermissionOption[]> = {}
		permOptions.forEach((o) => {
			const g = o.group || '其他'
			if (!map[g]) map[g] = []
			map[g].push(o)
		})
		return Object.keys(map).map((g) => ({ group: g, options: map[g] }))
	}, [permOptions])

	// 查询菜单内容
	const query = useMemoizedFn(async () => {
		try {
			const token = getToken()
			const resp = await fetch('/api/studio/menus/find', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { authorization: token } : {})
				}
			})
			const data = await resp.json() as MenusDataType
			setMenusData({
				items: data.items || [],
				setting: data.setting || [],
				id: data.id || ''
			})
		} catch (err: any) {
			message.error(err?.message || JSON.stringify(err))
		}
	})

	useEffect(() => {
		query()
	}, [])

	const resetFormData = useMemoizedFn((item?: MenuItemType) => {
		if (item) {
			const permVal = item.permission
				? String(item.permission)
						.split(',')
						.map((s) => s.trim())
						.filter(Boolean)
				: []
			form.setFieldsValue({
				type: item.type,
				name: item.name,
				path: item.path,
				icon: item.icon,
				permission: permVal
			})
			setIcon(item.icon || '')
			return
		}
		form.resetFields()
		setIcon('')
	})

	const handleSelectClick = useMemoizedFn((item: MenuItemType, subItem?: MenuItemType) => {
		setSelectedKeys([item.key || null, subItem?.key || null])
		setAction('modify')
		resetFormData(subItem ? subItem : item)
	})

	const findMenuItem = useMemoizedFn((parentKey: string, childKey?: string) => {
		const list = tab === 'menu' ? menusData.items : menusData.setting
		const parentItem = list.find((r) => r.key === parentKey)
		if (childKey) {
			return parentItem?.children?.find((r) => r.key === childKey)
		}
		return parentItem
	})

	const create = useMemoizedFn(() => {
		setAction('create')
		// 保持父菜单选中状态，新菜单将作为子菜单创建
		setSelectedKeys([selectedKeys[0], null])
		resetFormData()
	})

	const switchTab = useMemoizedFn((tabName: 'menu' | 'setting') => {
		setTab(tabName)
		setAction('create')
		setSelectedKeys([null, null])
		resetFormData()
	})

	const save = useMemoizedFn(async () => {
		try {
			const params = {
				id: menusData.id,
				menu: JSON.stringify(menusData.items),
				setting: JSON.stringify(menusData.setting)
			}
			const token = getToken()
			const resp = await fetch('/api/__yao/form/sys.menu/save', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { authorization: token } : {})
				},
				body: JSON.stringify(params)
			})
			if (!resp.ok) {
				const errData = await resp.json().catch(() => ({}))
				throw new Error(errData.message || `保存失败(${resp.status})`)
			}
			message.success('保存成功')
			await query()
			window.$app?.Event.emit('app/getUserMenu')
		} catch (err: any) {
			message.error(err?.message || JSON.stringify(err))
		}
	})

	const sort = useMemoizedFn((direction: 'up' | 'down', parentKey: string, childKey?: string) => {
		const list = tab === 'menu' ? menusData.items : menusData.setting
		const index = list.findIndex((r) => r.key === parentKey)
		if (index === -1) return

		if (!childKey) {
			const temp = JSON.parse(JSON.stringify(list[index]))
			if (direction === 'up' && index > 0) {
				list[index] = list[index - 1]
				list[index - 1] = temp
			}
			if (direction === 'down' && index < list.length - 1) {
				list[index] = list[index + 1]
				list[index + 1] = temp
			}
		} else {
			const children = list[index].children
			if (!children) return
			const childIndex = children.findIndex((r) => r.key === childKey)
			if (childIndex === -1) return
			const temp = JSON.parse(JSON.stringify(children[childIndex]))
			if (direction === 'up' && childIndex > 0) {
				children[childIndex] = children[childIndex - 1]
				children[childIndex - 1] = temp
			}
			if (direction === 'down' && childIndex < children.length - 1) {
				children[childIndex] = children[childIndex + 1]
				children[childIndex + 1] = temp
			}
		}
		save()
	})

	const del = useMemoizedFn(() => {
		const list = tab === 'menu' ? menusData.items : menusData.setting
		const parentItem = findMenuItem(selectedKeys[0] || '')
		if (!selectedKeys[1]) {
			if (parentItem?.children?.length) {
				message.error('下级菜单不为空，不允许删除')
			} else {
				const index = list.findIndex((r) => r.key === selectedKeys[0])
				if (index !== -1) {
					list.splice(index, 1)
					save()
				}
			}
			return
		}
		if (!parentItem?.children?.length) {
			message.error('选中的菜单已经被删除')
		}
		const item = findMenuItem(selectedKeys[0] || '', selectedKeys[1] || '')
		if (!item) {
			message.error('选中的菜单已经被删除')
			return
		}
		const index = parentItem?.children?.findIndex((r) => r.key === selectedKeys[1]) ?? -1
		if (index !== -1 && parentItem?.children) {
			parentItem.children.splice(index, 1)
			save()
		}
	})

	const showDeleteConfirm = useMemoizedFn(() => {
		if (!selectedKeys[0]) {
			message.error('请先选中一项菜单')
			return
		}
		Modal.confirm({
			title: '提示',
			content: '删除菜单后不可恢复，确认是否删除',
			okText: '确认',
			okType: 'danger',
			cancelText: '取消',
			onOk: del
		})
	})

	const systemUUID = () => {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0
			return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
		})
	}

	const onSubmit = useMemoizedFn(async () => {
		const values = await form.validateFields().catch(() => null)
		if (!values) return

		const list = tab === 'menu' ? menusData.items : menusData.setting
		const { permission, ...rest } = values
		const data = {
			...rest,
			permission: Array.isArray(permission) && permission.length ? permission.join(',') : ''
		} as MenuItemType

		if (action === 'modify') {
			const item = findMenuItem(selectedKeys[0] || '', selectedKeys[1] || '')
			if (item) {
				Object.assign(item, data)
				save()
			} else {
				message.error('保存失败，选中的菜单不存在')
			}
			return
		}

		data.key = systemUUID()
		if (!selectedKeys[0]) {
			list.push(data)
			save()
			return
		}
		const item = findMenuItem(selectedKeys[0] || '')
		if (!item) {
			message.error('保存失败，选中的菜单不存在')
			return
		}
		if (!item.children) {
			item.children = [data]
		} else {
			item.children.push(data)
		}
		save()
	})

	const resetForm = useMemoizedFn(() => {
		setSelectedKeys([null, null])
		resetFormData()
	})

	const formType = Form.useWatch('type', form)
	const showForm = selectedKeys[0] || action === 'create'

	return (
		<div className={styles._local}>
			<aside className={styles.pageTitle}>
				<p className={styles.pageTitleLabel}>导航设置</p>
				<div className={styles.pageDescription}>
					你可以配置应用的导航菜单，包括添加
					<span className={styles.action}>删除菜单，</span>
					<span className={styles.action}>拖拽调整</span> 菜单顺序，设置菜单
				</div>
			</aside>

			<div className={styles.innerContainer}>
				<aside className={styles.navTabs}>
					<div className={styles.tabs}>
						<div
							className={clsx(styles.tabItem, styles.tabLabel, tab === 'menu' && styles.tabItemActive)}
							onClick={() => switchTab('menu')}
						>
							主导航设置
						</div>
						<div
							className={clsx(styles.tabItem, styles.tabLabel, tab === 'setting' && styles.tabItemActive)}
							onClick={() => switchTab('setting')}
						>
							系统菜单设置
						</div>
					</div>
					<div className={styles.menusConfig}>
						<div className={styles.createContainer}>
							<Button type='primary' size='small' onClick={create}>
								新建
							</Button>
						</div>
						<div className={styles.menusList}>
							<ul>
								{activeList.map((item, index) => {
									const isSelectedParent = selectedKeys[0] === item.key
									return (
										<li
											key={item.key}
											className={clsx(styles.menuItem, isSelectedParent && styles.selected)}
										>
											<div
												className={styles.menuItemTitle}
												onClick={() => handleSelectClick(item)}
											>
												<span className={styles.menuTitleContent}>
													{item.icon && <i className={item.icon} />}
													<span className={styles.menuName}>{item.name}</span>
													{isSelectedParent && (
														<span className={styles.menuActions} onClick={(e) => e.stopPropagation()}>
															<Tooltip title='删除'>
																<i className='icon-trash-2' onClick={() => showDeleteConfirm()} />
															</Tooltip>
															{index < activeList.length - 1 && (
																<Tooltip title='下移'>
																	<i
																		className='icon-chevrons-down'
																		onClick={() => sort('down', item.key!)}
																	/>
																</Tooltip>
															)}
															{index > 0 && (
																<Tooltip title='上移'>
																	<i
																		className='icon-chevrons-up'
																		onClick={() => sort('up', item.key!)}
																	/>
																</Tooltip>
															)}
														</span>
													)}
												</span>
											</div>
											{item?.children && item.children.length > 0 && (
												<ul className={styles.menuSub}>
													{item.children.map((subItem, childIndex) => {
														const isSelectedChild = selectedKeys[1] === subItem.key
														return (
															<li
																key={subItem.key}
																className={clsx(styles.menuSubItem, isSelectedChild && styles.selected)}
																onClick={() => handleSelectClick(item, subItem)}
															>
																<span className={styles.menuTitleContent}>
																	{subItem.icon && <i className={subItem.icon} />}
																	<span className={styles.menuName}>{subItem.name}</span>
																	{isSelectedChild && (
																		<span
																			className={styles.menuActions}
																			onClick={(e) => e.stopPropagation()}
																		>
																			<Tooltip title='删除'>
																				<i
																					className='icon-trash-2'
																					onClick={() => showDeleteConfirm()}
																				/>
																			</Tooltip>
																			{childIndex < item.children!.length - 1 && (
																				<Tooltip title='下移'>
																					<i
																						className='icon-chevrons-down'
																						onClick={() => sort('down', item.key!, subItem.key!)}
																					/>
																				</Tooltip>
																			)}
																			{childIndex > 0 && (
																				<Tooltip title='上移'>
																					<i
																						className='icon-chevrons-up'
																						onClick={() => sort('up', item.key!, subItem.key!)}
																					/>
																				</Tooltip>
																			)}
																		</span>
																	)}
																</span>
															</li>
														)
													})}
												</ul>
											)}
										</li>
									)
								})}
							</ul>
						</div>
					</div>
				</aside>

				<div className={styles.configSection}>
					{showForm ? (
						<div className={styles.configSetting}>
							<Form
								form={form}
								layout='vertical'
								initialValues={{ type: 'item', name: '', icon: '', path: '', permission: '' }}
							>
								<Form.Item label='菜单属性' name='type'>
									<Radio.Group>
										<Radio value='item'>菜单项</Radio>
										<Radio value='group'>分组</Radio>
									</Radio.Group>
								</Form.Item>
								<Form.Item
									label='菜单名称'
									name='name'
									rules={[{ required: true, message: '请输入菜单名称' }]}
								>
									<Input placeholder='请输入菜单名称' />
								</Form.Item>
								<Form.Item label='菜单图标' name='icon'>
									<IconPicker value={icon} onChange={(v) => { setIcon(v); form.setFieldValue('icon', v) }} />
								</Form.Item>
								{formType === 'item' && (
									<Form.Item
										label='路径'
										name='path'
										rules={[{ required: true, message: '请输入菜单路径' }]}
									>
										<Input placeholder='请输入菜单路径' />
									</Form.Item>
								)}
								<Form.Item
								label='访问权限'
								name='permission'
								tooltip='配置可见所需权限点，拥有任一权限点即可看到该菜单；不配置表示不限制'
							>
								<PermField groups={permGroups} />
							</Form.Item>
								<Form.Item className={styles.formActions}>
									<Button type='primary' onClick={onSubmit}>
										保存
									</Button>
									<Button style={{ marginLeft: 10 }} onClick={resetForm}>
										取消
									</Button>
								</Form.Item>
							</Form>
						</div>
					) : (
						<div className={styles.noData}>
							<div className={styles.noDataImg} />
							<div>
								<p className={styles.noDataLabel}>主导航</p>
								<p className={styles.noDataDesc}>点击左侧新建菜单项目/选择默认菜单项修改</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default new window.$app.Handle(Index).by(window.$app.memo).get()