import { createRoot } from 'react-dom/client'

import { createModalContainer } from '@/actions/utils'
import Modal from '@/components/base/Modal'
import { Bind } from '@/utils'

import type { IProps as IPropsModal } from '@/components/base/Modal'
import type { OnAction } from '../useAction'
import type { Action } from '@/types'

type Args = Omit<OnAction, 'it'> & { payload: Action.ActionMap['Common.openModal'] }

export default ({ namespace, primary, data_item, extra, payload }: Args) => {
	// 用行数据（行内按钮）与 URL query（顶部按钮）渲染 payload 中的 {{xxx}} 模板
	const boundPayload = Bind(payload, { ...(data_item || {}), ...(extra?.query || {}) }) as typeof payload
	const id =
		boundPayload.Form?.id != undefined
			? boundPayload.Form.id
			: boundPayload.Page?.id != undefined
			? boundPayload.Page.id
			: data_item
			? data_item[primary]
			: 0

	const props_modal: IPropsModal = { namespace, id: id, config: boundPayload }
	return () =>
		new Promise<void>((resolve) => {
			createRoot(createModalContainer(namespace)).render(<Modal {...props_modal}></Modal>)
			resolve()
		})
}
