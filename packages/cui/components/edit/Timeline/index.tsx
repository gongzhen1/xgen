import { Item } from '@/components'
import type { Component } from '@/types'
import Timeline from '@/components/view/Timeline'

interface FlowLogEvent {
	time: string
	action: string
	message: string
}

interface IProps extends Component.PropsEditComponent {
	value?: string | FlowLogEvent[]
}

const Index = (props: IProps) => {
	const { __bind, __name, __hidelabel, value, ...rest } = props

	return (
		<Item {...{ __bind, __name, hideLabel: __hidelabel }}>
			<Timeline __value={value} onSave={() => {}} {...rest} />
		</Item>
	)
}

export default window.$app.memo(Index)