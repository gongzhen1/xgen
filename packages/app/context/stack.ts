import { findLastIndex } from 'lodash-es'
import { makeAutoObservable } from 'mobx'
import store from 'store2'
import { singleton } from 'tsyringe'

@singleton()
export default class Index {
	paths = [] as Array<string>

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	push(path: string) {
		this.paths.push(path)
		this.sync()
	}

	pop() {
		this.paths.pop()
		this.sync()
	}

	remove(path: string) {
		const index = findLastIndex(this.paths, (item: string) => item === path)

		this.paths.slice(index + 1)
		this.sync()
	}

	reset() {
		this.paths = []
		this.sync()
	}

	sync() {
		store.set('__paths', this.paths)
	}

	on() {
		window.$app.Event.on('global.stack.pop', this.pop)
		window.$app.Event.on('global.stack.remove', this.remove)
	}

	off() {
		window.$app.Event.off('global.stack.pop', this.pop)
		window.$app.Event.off('global.stack.remove', this.remove)
	}
}
