import { X } from '@/components'
import CustomPageView from '@/components/custompage/Renderer'
import { useMatch } from '@/hooks'
import { history, useSearchParams } from '@umijs/max'

import type { Global } from '@/types'

/** Dynamically forward to the components */
const Index = () => {
	const [params] = useSearchParams()
	const search_params = Object.fromEntries(params)

	const { type, model, id, formType } = useMatch<Global.Match>(
		/^\/x\/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?(?:\/([^\/]+))?/,
		['type', 'model', 'id', 'formType']
	)

	if (!model) history.push('/404')

	// /x/render/{pageName}：在 Admin 布局内(带侧边栏)渲染自定义高级页面
	if (type === 'render') {
		return <CustomPageView pageName={decodeURIComponent(model)} props={search_params} />
	}

	return (
		<X
			type='base'
			name={type}
			props={{ parent: 'Page', model, search_params, id, form: { type: formType } }}
		></X>
	)
}

export default Index
