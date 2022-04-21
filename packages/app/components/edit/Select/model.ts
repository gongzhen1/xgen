import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { Select } from '@/models'

import type { SelectProps } from 'antd'

@injectable()
export default class Index {
	get options(): SelectProps['options'] {
		return this.model.options
	}

	get target_props() {
		return this.model.select_props
	}

	constructor(public model: Select) {
		makeAutoObservable(this, {}, { autoBind: true })
	}
}
