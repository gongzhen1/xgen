export default interface Action {
	title: string
	icon: string
	type: 'view' | 'edit'
	how: 'page' | 'model'
	props: {
		model: string
		bind: string
		style?: 'danger'
		disabled?: {
			bind: string
			value: string | Array<string>
		}
	}
}
