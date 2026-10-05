import { history } from '@umijs/max'

import { Bind } from '@/utils'

import type { Action } from '@/types'
import type { OnAction } from '../useAction'
import { local, session } from '@yaoapp/storex'

type Args = Pick<OnAction, 'namespace' | 'extra' | 'data_item'>

export default ({ namespace, extra, data_item }: Args) => {
	const getToken = (): string => {
		const is_session_token = local.token_storage === 'sessionStorage'
		const token = is_session_token ? session.token : local.token
		return token || ''
	}

	const filterQuery = (query: Record<string, string | undefined>) => {
		const result: Record<string, string> = {}
		for (const key in query) {
			if (query[key] !== undefined && query[key] !== null && query[key] !== '') {
				result[key] = query[key] as string
			}
		}
		return result
	}

	// 模板数据：行数据（行内按钮）+ URL query（顶部按钮），供 payload 中 {{team_id}} 等变量渲染
	const bind_data = { ...(data_item || {}), ...(extra?.query || {}) }

	return (rawPayload: Action.ActionMap['Common.historyPush']) =>
		new Promise<void>((resolve) => {
			const payload = Bind(rawPayload, bind_data) as Action.ActionMap['Common.historyPush']
			const search = payload.search ? new URLSearchParams(payload.search).toString() : undefined
			const query =
				payload?.withFilterQuery && extra?.query
					? new URLSearchParams(filterQuery(extra.query)).toString()
					: undefined

			let params = search || query ? `?${search ?? ''}${query ?? ''}` : ''

			if (payload.pathname.startsWith('http')) {
				resolve()

				return window.open(payload.pathname + params)
			} else {
				if (payload.public) {
					resolve()
					if (payload.withToken) {
						const name = typeof payload.withToken === 'string' ? payload.withToken : '__tk'
						const token = getToken()
						params = params ? `?${name}=${token}&${params.slice(1)}` : `?${name}=${token}`
					}
					return window.open(window.location.origin + payload.pathname + params)
				}

				window.addEventListener('popstate', () => resolve(), { once: true })

				if (history.location.pathname.indexOf(payload.pathname) !== -1) {
					resolve()
					window.$app.Event.emit(`${namespace}/refetch`)
				} else {
					history.push({
						pathname: payload.pathname,
						search
					})
				}
			}
		})
}
