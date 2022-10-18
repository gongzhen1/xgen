import axios from 'axios'
import store from 'store2'
import { injectable } from 'tsyringe'

import { catchError } from '@/knife'

import type { Response } from '@/types'

@injectable()
export default class Index {
	@catchError()
	getAppInfo<Res>() {
		const sid = window.crypto.randomUUID()
		const lang = window.navigator.language.toLowerCase()
		const time = new Date().toLocaleString().replaceAll('/', '-')

		store.set('temp_sid', sid)

		return axios.post<{}, Response<Res>>(`/api/__yao/app/setting`, { sid, lang, time })
	}

	@catchError()
	getUserMenu<Res>() {
		return axios.get<{}, Response<Res>>(`/api/${window.$app.api_prefix}/app/menu`)
	}
}
