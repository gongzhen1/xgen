import { Radio, Select } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import Item from '../Item'
import { getLocale } from '@umijs/max'

import type { ApproverConfigValue, IProps } from './types'

type OptionItem = { label: string; value: string }

const OPTIONS_TYPE = [
	{ label: '固定人员', value: 'fixed' },
	{ label: '动态范围', value: 'scope' },
	{ label: '发起人自选', value: 'starter' },
]

const OPTIONS_MULTIPLE = [
	{ label: '否', value: 0 },
	{ label: '是', value: 1 },
]

const OPTIONS_SCOPE = [
	{ label: '全体用户', value: 'all' },
	{ label: '指定权签组', value: 'teams' },
	{ label: '指定人员', value: 'users' },
]

function defaultValue(): ApproverConfigValue {
	return {
		type: 'fixed',
		users: [],
		teams: [],
		roles: [],
		starter_multiple: 0,
		starter_scope: 'all',
		starter_teams: [],
		starter_users: [],
	}
}

const Index = (props: IProps) => {
	const { value, onChange, __name, ...rest } = props
	const is_cn = getLocale() === 'zh-CN'

	const [inner, setInner] = useState<ApproverConfigValue>(() => {
		if (value && typeof value === 'object') {
			return { ...defaultValue(), ...value }
		}
		return defaultValue()
	})

	// 远程选项
	const [teamOptions, setTeamOptions] = useState<OptionItem[]>([])
	const [roleOptions, setRoleOptions] = useState<OptionItem[]>([])
	const [userOptions, setUserOptions] = useState<OptionItem[]>([])

	// 回填标记：避免重复加载已选回填
	const userLoadedRef = useRef(false)
	const teamLoadedRef = useRef(false)
	const roleLoadedRef = useRef(false)

	const handleChange = (patch: Partial<ApproverConfigValue>) => {
		const next = { ...inner, ...patch }
		setInner(next)
		onChange?.(next)
	}

	// 加载 teams / roles（全量，数据量小）
	useEffect(() => {
		if (teamLoadedRef.current) return
		teamLoadedRef.current = true
		axios
			.get<OptionItem[]>('/api/approval/teams/options')
			.then((res: any) => setTeamOptions(Array.isArray(res) ? res : res.data || []))
			.catch(() => setTeamOptions([]))
	}, [])

	useEffect(() => {
		if (roleLoadedRef.current) return
		roleLoadedRef.current = true
		axios
			.get<OptionItem[]>('/api/approval/roles/options')
			.then((res: any) => setRoleOptions(Array.isArray(res) ? res : res.data || []))
			.catch(() => setRoleOptions([]))
	}, [])

	// 加载 users：若已有选中值，先按 selected 回填
	useEffect(() => {
		if (userLoadedRef.current) return
		userLoadedRef.current = true
		const selected = inner.users.length ? inner.users : inner.starter_users.length ? inner.starter_users : []
		const params: any = { limit: 50 }
		if (selected.length) params.selected = selected
		axios
			.get<OptionItem[]>('/api/approval/users/options', { params })
			.then((res: any) => setUserOptions(Array.isArray(res) ? res : res.data || []))
			.catch(() => setUserOptions([]))
	}, [inner.users, inner.starter_users])

	// users 搜索（防抖 500ms）
	const searchTimer = useRef<any>(null)
	const handleUserSearch = (v: string) => {
		if (searchTimer.current) clearTimeout(searchTimer.current)
		searchTimer.current = setTimeout(() => {
			const params = { keywords: v }
			axios
				.get<OptionItem[]>('/api/approval/users/options', { params })
				.then((res: any) => setUserOptions(Array.isArray(res) ? res : res.data || []))
				.catch(() => {})
		}, 500)
	}

	// 类型切换时清理不相关字段（可选，保持数据干净）
	const handleTypeChange = (type: string) => {
		handleChange({ type: type as any })
	}

	const commonSelectProps: any = {
		popupClassName: 'xgen-select-dropdown',
		getPopupContainer: (node: any) => node.parentNode,
		notFoundContent: is_cn ? '无数据' : 'No data',
	}

	return (
		<Item __name={__name} __bind='approver_config'>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
				{/* 审批人来源 */}
				<div>
					<div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
						{is_cn ? '审批人来源' : 'Approver Source'}
					</div>
					<Radio.Group
						options={OPTIONS_TYPE}
						value={inner.type}
						onChange={(e) => handleTypeChange(e.target.value)}
						optionType='button'
						buttonStyle='solid'
						size='small'
					/>
				</div>

				{/* fixed：用户多选 */}
				{inner.type === 'fixed' && (
					<div>
						<div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
							{is_cn ? '指定审批人' : 'Select Approvers'}
						</div>
						<Select
							{...commonSelectProps}
							mode='multiple'
							showSearch
							filterOption={false}
							placeholder={is_cn ? '搜索并选择用户' : 'Search and select users'}
							options={userOptions}
							value={inner.users}
							onSearch={handleUserSearch}
							onChange={(v) => handleChange({ users: v as string[] })}
							style={{ width: '100%' }}
						/>
					</div>
				)}

				{/* scope：组多选 + 角色多选 */}
				{inner.type === 'scope' && (
					<>
						<div>
							<div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
								{is_cn ? '权签组（可多选）' : 'Teams'}
							</div>
							<Select
								{...commonSelectProps}
								mode='multiple'
								showSearch
								filterOption={(input, option) =>
									String(option?.label || option?.value)
										.toLowerCase()
										.indexOf(input.toLowerCase()) >= 0
								}
								placeholder={is_cn ? '选择权签组' : 'Select teams'}
								options={teamOptions}
								value={inner.teams}
								onChange={(v) => handleChange({ teams: v as string[] })}
								style={{ width: '100%' }}
							/>
						</div>
						<div>
							<div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
								{is_cn ? '权签角色（可多选）' : 'Roles'}
							</div>
							<Select
								{...commonSelectProps}
								mode='multiple'
								showSearch
								filterOption={(input, option) =>
									String(option?.label || option?.value)
										.toLowerCase()
										.indexOf(input.toLowerCase()) >= 0
								}
								placeholder={is_cn ? '选择角色（与组为交集）' : 'Select roles (intersection with teams)'}
								options={roleOptions}
								value={inner.roles}
								onChange={(v) => handleChange({ roles: v as string[] })}
								style={{ width: '100%' }}
							/>
						</div>
						<div style={{ fontSize: 11, color: '#94a3b8' }}>
							{is_cn
								? '说明：组与角色为交集，只选组=组内全员，只选角色=所有组中该角色'
								: 'Note: teams and roles are intersected'}
						</div>
					</>
				)}

				{/* starter：允许多人 + 候选范围 + 条件子表单 */}
				{inner.type === 'starter' && (
					<>
						<div style={{ display: 'flex', gap: 12 }}>
							<div style={{ flex: 1 }}>
								<div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
									{is_cn ? '允许多人' : 'Allow Multiple'}
								</div>
								<Select
									{...commonSelectProps}
									placeholder={is_cn ? '是否允许多人' : 'Allow multiple approvers?'}
									options={OPTIONS_MULTIPLE}
									value={inner.starter_multiple}
									onChange={(v) => handleChange({ starter_multiple: v as 0 | 1 })}
									style={{ width: '100%' }}
								/>
							</div>
							<div style={{ flex: 1 }}>
								<div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
									{is_cn ? '候选范围' : 'Candidate Scope'}
								</div>
								<Select
									{...commonSelectProps}
									placeholder={is_cn ? '候选范围' : 'Scope'}
									options={OPTIONS_SCOPE}
									value={inner.starter_scope}
									onChange={(v) => handleChange({ starter_scope: v as any })}
									style={{ width: '100%' }}
								/>
							</div>
						</div>
						{inner.starter_scope === 'teams' && (
							<div>
								<div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
									{is_cn ? '可选权签组' : 'Available Teams'}
								</div>
								<Select
									{...commonSelectProps}
									mode='multiple'
									showSearch
									filterOption={(input, option) =>
										String(option?.label || option?.value)
											.toLowerCase()
											.indexOf(input.toLowerCase()) >= 0
									}
									placeholder={is_cn ? '发起人可从中选择组' : 'Starter can choose from these teams'}
									options={teamOptions}
									value={inner.starter_teams}
									onChange={(v) => handleChange({ starter_teams: v as string[] })}
									style={{ width: '100%' }}
								/>
							</div>
						)}
						{inner.starter_scope === 'users' && (
							<div>
								<div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
									{is_cn ? '可选人员' : 'Available Users'}
								</div>
								<Select
									{...commonSelectProps}
									mode='multiple'
									showSearch
									filterOption={false}
									placeholder={is_cn ? '搜索并选择用户' : 'Search and select users'}
									options={userOptions}
									value={inner.starter_users}
									onSearch={handleUserSearch}
									onChange={(v) => handleChange({ starter_users: v as string[] })}
									style={{ width: '100%' }}
								/>
							</div>
						)}
					</>
				)}
			</div>
		</Item>
	)
}

export default window.$app.memo(Index)
