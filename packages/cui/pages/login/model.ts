import { message } from 'antd'
import { findIndex } from 'lodash-es'
import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { GlobalModel } from '@/context/app'
import { getPath, reg_email, reg_mobile } from '@/utils'
import { history } from '@umijs/max'
import { local, session } from '@yaoapp/storex'

import Service from './services'

import type { Global, Utils } from '@/types'
import type { UserType, Captcha, ReqLogin, ResLogin, FormValues } from './types'

@injectable()
export default class Model {
	user_type = '' as UserType
	captcha = {} as Captcha
	/** 后端 .env YAO_LOGIN_CAPTCHA 控制的验证码开关，默认 true（查询失败时按开启处理） */
	captcha_enabled = true
	loading = {} as Global.BooleanObject
	/** 记住密码勾选状态与账号信息（登录成功后写入 localStorage） */
	remember_me = false
	remember_account = ''
	remember_password = ''
	is?: string

	constructor(public global: GlobalModel, private service: Service) {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	async initCaptcha() {
		try {
			const { res } = await this.service.getConfig<{ captcha_enabled: boolean }>()
			this.captcha_enabled = res?.captcha_enabled !== false
		} catch (e) {
			this.captcha_enabled = true
		}

		if (this.captcha_enabled) this.getCaptcha()
	}

	async getCaptcha() {
		const { res, err } = await this.service.getCaptcha<Captcha>(
			this.user_type === 'user' ? this.global.app_info?.login?.user?.captcha : ''
		)

		if (err) return

		this.captcha = res
	}

	async login(data: ReqLogin) {
		this.loading.login = true

		const { res, err } = await this.service.login<ReqLogin, ResLogin>(
			data,
			this.user_type === 'user' ? this.global.app_info?.login?.user?.login : ''
		)

		this.afterLogin(res, err)
	}

	async afterLogin(res: ResLogin, err: Utils.ResError) {
		if (err || !res?.token) {
			this.loading.login = false
			this.getCaptcha()

			return
		}

		// Save sid
		if (res.sid) {
			local.temp_sid = res.sid
		}

		const user_type = this.user_type === 'user' ? 'user' : 'admin'
		const entry = res.entry || this.global.app_info?.login?.entry?.[user_type]
		if (!entry) return message.warning(this.global.locale_messages.login.no_entry)

		const current_nav = findIndex(res.menus.items, (item) => item.path === entry) || 0
		this.global.user = res.user
		this.global.setMenus(res.menus, current_nav, false)

		if (this.global.app_info.token?.storage === 'localStorage') {
			local.token = res.token

			if (res.studio) local.studio = res.studio
		} else {
			session.token = res.token

			if (res.studio) session.studio = res.studio
		}

		local.user = res.user
		local.current_nav = current_nav
		local.login_url = getPath(history.location.pathname)
		local.logout_redirect = res.logout_redirect || false

		// 记住密码：勾选时保存（密码 base64 编码存储），未勾选时清除
		if (this.remember_me) {
			local.login_remember = {
				account: this.remember_account,
				password: window.btoa(encodeURIComponent(this.remember_password))
			}
		} else {
			delete local.login_remember
		}

		await window.$app.sleep(600)
		this.loading.login = false
		history.push(entry)
	}

	onFinish(data: FormValues) {
		const { mobile, password, code, remember_me } = data
		const account = (mobile || '').trim()

		// 捕获记住密码勾选与凭据，登录成功后（afterLogin）写入 localStorage
		this.remember_me = !!remember_me
		this.remember_account = account
		this.remember_password = password || ''

		const is_email = account.indexOf('@') !== -1
		const is_mobile = /^[0-9]+$/.test(account)

		if (is_email) {
			if (!reg_email.test(account)) {
				return message.warning(this.global.locale_messages.login.form.validate.email)
			}
		} else if (is_mobile) {
			if (!reg_mobile.test(account)) {
				return message.warning(this.global.locale_messages.login.form.validate.mobile)
			}
		}
		// 其他情况视为用户名登录，不做格式校验

		const loginParam: any = {
			password: password,
			sid: local.temp_sid,
			...(this.is ? { is: this.is } : {})
		}

		// 仅在验证码开启时携带验证码参数
		if (this.captcha_enabled) {
			loginParam.captcha = {
				id: this.captcha.id,
				code
			}
		}

		if (is_email) {
			loginParam.email = account
		} else if (is_mobile) {
			loginParam.mobile = account
		} else {
			loginParam.username = account
		}

		this.login(loginParam)
	}
}
