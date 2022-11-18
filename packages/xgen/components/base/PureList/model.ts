import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { ColumnUtils, Common } from '@/services'

import { createId, handleChildren, updateChildren } from './utils'

import type { ActionType, ParentIds } from './types'

@injectable()
export default class Model {
	list = [] as Array<any>

	constructor(private common: Common, private column_utils: ColumnUtils) {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	init(initial_value: Array<any>) {
		this.list = [
			{
				id: '1',
				name: 'shrek',
				children: [
					{
						id: '1-1',
						name: 'shrek 1'
					},
					{
						id: '1-2',
						name: 'shrek 2'
					},
					{
						id: '1-3',
						name: 'shrek 3',
						children: [
							{
								id: '1-3-1',
								name: 'three 1'
							},
							{
								id: '1-3-2',
								name: 'three 2'
							},
							{
								id: '1-3-3',
								name: 'three 3'
							}
						]
					}
				]
			},
			{
				id: '2',
				name: 'fiona',
				children: [
					{
						id: '2-1',
						name: 'fiona 1'
					},
					{
						id: '2-2',
						name: 'fiona 2'
					},
					{
						id: '2-3',
						name: 'fiona 3'
					}
				]
			}
		]
	}

	onAdd(parentIds: ParentIds) {
		if (!parentIds.length) return this.list.push({ id: createId() })

		this.list = handleChildren(this.list, 'add', parentIds)
	}

	onSort(v: Array<any>, parentIds?: ParentIds) {
		const list = v.filter((v) => v)

		if (!parentIds?.length) {
			this.list = list
		} else {
			this.list = updateChildren(this.list, v, parentIds)
		}
	}

	onAction(type: ActionType, parentIds: ParentIds) {
		switch (type) {
			case 'fold':
				this.list = handleChildren(this.list, 'fold', parentIds)
				break
			case 'add':
				if (!parentIds.length) return this.list.push({ id: createId() })

				this.list = handleChildren(this.list, 'add', parentIds)
				break
			case 'addChild':
				this.list = handleChildren(this.list, 'addChild', parentIds)
				break
			case 'remove':
				this.list = handleChildren(this.list, 'remove', parentIds)
				break
			default:
				break
		}
	}
}