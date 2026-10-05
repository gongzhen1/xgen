import { Button, Checkbox, Form, Input } from 'antd'
import clsx from 'clsx'
import { useEffect } from 'react'

import { useIntl } from '@/hooks'
import { Icon } from '@/widgets'
import { local } from '@yaoapp/storex'
import { getLocale } from '@umijs/max'

const { Item, useForm } = Form

import type { IPropsForm } from '@/pages/login/types'

const Index = (props: IPropsForm) => {
	const { code, loading, captcha_enabled, getCaptcha, onFinish } = props
	const [form] = useForm()
	const { getFieldValue } = form
	const messages = useIntl()
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 回填记住的账号密码（localStorage login_remember，密码 base64 存储）
	useEffect(() => {
		const remembered = local.login_remember
		if (remembered?.account) {
			form.setFieldsValue({
				mobile: remembered.account,
				password: remembered.password ? decodeURIComponent(window.atob(remembered.password)) : '',
				remember_me: true
			})
		}
	}, [])

	return (
		<Form className='form_wrap border_box flex flex_column' name='form_login' form={form} onFinish={onFinish}>
			<div className='input_wrap'>
				<Item noStyle shouldUpdate>
					{() => (
						<Item noStyle name='mobile'>
							<Input
								className={clsx([
									'input input_mobile',
									getFieldValue('mobile') ? 'has_value' : '',
									!is_cn && 'en'
								])}
								type='text'
								maxLength={30}
								prefix={<Icon name='person_outline-outline' size={21}></Icon>}
								autoComplete='username'
							></Input>
						</Item>
					)}
				</Item>
			</div>
			<div className='input_wrap'>
				<Item noStyle shouldUpdate>
					{() => (
						<Item noStyle name='password'>
							<Input
								className={clsx([
									'input input_password',
									getFieldValue('password') ? 'has_value' : '',
									!is_cn && 'en'
								])}
								type='password'
								maxLength={23}
								prefix={<Icon name='lock-outline' size={21}></Icon>}
								autoComplete='current-password'
							></Input>
						</Item>
					)}
				</Item>
			</div>
			{captcha_enabled && (
				<div className='input_wrap relative'>
					<Item noStyle shouldUpdate>
						{() => (
							<Item noStyle name='code'>
								<Input
									className={clsx([
										'input input_captcha_code',
										getFieldValue('code') ? 'has_value' : '',
										!is_cn && 'en'
									])}
									type='text'
									maxLength={6}
									prefix={<Icon name='security-outline' size={20}></Icon>}
								></Input>
							</Item>
						)}
					</Item>
					<span
						className='img_captcha_code absolute cursor_point border_box'
						style={{
							backgroundImage: code ? `url(${code})` : undefined
						}}
						onClick={getCaptcha}
					/>
				</div>
			)}
			<Item name='remember_me' valuePropName='checked' noStyle>
				<Checkbox style={{ marginTop: 4 }}>{messages.login.form.remember_me}</Checkbox>
			</Item>
			<Item noStyle shouldUpdate>
				{() => (
					<Button
						className={clsx([
							'btn_login',
							!(
								getFieldValue('mobile') &&
								getFieldValue('password') &&
								(!captcha_enabled || getFieldValue('code'))
							) && 'disabled'
						])}
						type='primary'
						htmlType='submit'
						shape='round'
						loading={loading}
					>
						{messages.login.title}
					</Button>
				)}
			</Item>
		</Form>
	)
}

export default window.$app.memo(Index)
