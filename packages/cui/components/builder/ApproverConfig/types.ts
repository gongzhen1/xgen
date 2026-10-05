import type { RadioProps, SelectProps } from 'antd'

export type ApproverConfigType = 'fixed' | 'scope' | 'starter'
export type StarterScopeType = 'all' | 'teams' | 'users'

export interface ApproverConfigValue {
	type: ApproverConfigType
	users: string[]
	teams: string[]
	roles: string[]
	starter_multiple: 0 | 1
	starter_scope: StarterScopeType
	starter_teams: string[]
	starter_users: string[]
}

export interface IProps {
	value?: ApproverConfigValue | null
	onChange?: (value: ApproverConfigValue) => void
	__name: string
}

export interface IInnerProps {
	value: ApproverConfigValue
	onChange: (value: ApproverConfigValue) => void
	is_cn: boolean
}

export interface IRemoteSelectProps extends SelectProps {
	xProps?: {
		remote: { api: string; params?: Record<string, any> }
		search: { api: string; params?: Record<string, any>; key: string }
	}
}
