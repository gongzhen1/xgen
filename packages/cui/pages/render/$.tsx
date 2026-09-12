import { useMatch } from '@/hooks'
import { history } from '@umijs/max'

import CustomPageView from '@/components/custompage/Renderer'

const Index = () => {
	const { name } = useMatch<{ name: string }>(/^\/render\/([^/]+)/, ['name'])

	if (!name) {
		history.push('/404')
		return null
	}

	return <CustomPageView pageName={decodeURIComponent(name)} />
}

export default Index