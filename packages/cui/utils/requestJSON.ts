import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

import { getToken } from '@/knife'

/**
 * 直接请求 yao 后端接口（类似 lowcode-studio 的 requestJSON）。
 * 携带当前登录 token（authorization: Bearer xxx），返回 response.data。
 */
const requestJSON = async <T = any>(
	url: string,
	method: 'GET' | 'POST' = 'GET',
	data?: any,
	headers?: Record<string, string>
): Promise<T> => {
	const defaultHeaders: Record<string, string> = {
		'Content-Type': 'application/json'
	}

	const token = getToken()
	if (token) defaultHeaders['authorization'] = token

	const options: AxiosRequestConfig = {
		url,
		method,
		headers: headers || defaultHeaders
	}

	if (data) options.data = JSON.stringify(data)

	try {
		const resp: AxiosResponse<T> = await axios.request<T>(options)
		return resp.data
	} catch (err: any) {
		const res = err?.response
		const errData = res?.data

		if (typeof errData === 'string') throw errData

		if (errData && (errData.message || errData.error)) {
			throw errData
		}

		throw err
	}
}

export default requestJSON
