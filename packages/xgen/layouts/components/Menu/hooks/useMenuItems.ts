import type { IPropsMenu } from '../../../types'

const Index = (items: IPropsMenu['items'], prefix?: string) => {
	return items.reduce((total: Array<any>, item) => {
		const _item: any = {}
		const key = `${prefix ?? ''}/${item.name}|${item.path}`

		_item['label'] = item.name
		_item['key'] = key

		if (item?.children?.length) {
			_item['children'] = Index(item.children, key)
		}

		total.push(_item)

		return total
	}, [])
}

export default Index