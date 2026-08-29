import { Icon } from '@/widgets'
import { IconName, IconSize } from '../../utils'
import { useBuilderContext } from '../Builder/Provider'
import { useGlobal } from '@/context/app'
import { Color } from '@/utils'
import { message } from 'antd'

interface IProps {
	height?: number
	visible?: boolean
	toggleSidebar: () => void
}

const Index = (props: IProps) => {
	const className = 'sidebar' + (!props.visible ? ' collapsed' : '')
	const { setting, CreateNode, setNodes, nodes, is_cn } = useBuilderContext()
	const global = useGlobal()
	const TextColor = (color?: string) => {
		return color && color != '' ? Color(color, global.theme) : Color('text', global.theme)
	}

	const handleAddNode = (typeName: string) => {
		// Find the rightmost node to place the new node to its right
		const maxX = nodes.reduce((max, n) => Math.max(max, n.position?.x || 0), 0)
		const maxY = nodes.reduce((max, n) => Math.max(max, n.position?.y || 0), 0)
		const position = { x: Math.max(maxX + 320, 320), y: Math.max(maxY, 0) }

		const newNode = CreateNode(typeName, is_cn ? '<未命名>' : '<Unnamed>', position)
		if (!newNode) {
			message.error(is_cn ? '创建节点失败' : 'Failed to create node')
			return
		}
		setNodes((nds: any) => nds.concat(newNode))
	}

	return (
		<div className='relative'>
			<a
				onClick={props.toggleSidebar}
				className='toggle-sidebar'
				style={{ top: (props.height || 300 - 32) / 2 }}
			>
				<Icon name={props.visible ? 'material-first_page' : 'material-last_page'} size={14} />
			</a>
			<div className={className}>
				<div
					className='content'
					style={{ maxHeight: props.height, minHeight: props.height, height: props.height }}
				>
					{setting?.types?.map((type, index) => (
						<div
							key={`${type.name}|${index}`}
							className='item'
							draggable={true}
							unselectable='on'
							onDragStart={(e) =>
								e.dataTransfer.setData('application/reactflow', type.name)
							}
							onClick={() => handleAddNode(type.name)}
							title={type.label ? type.label : type.name}
						>
							<Icon
								size={IconSize(type.icon, 14)}
								name={IconName(type.icon)}
								color={type.color}
								className='mr_6'
							/>
							<span className='label' style={{ color: TextColor(type.color) }}>
								{type.label ? type.label : type.name}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

export default window.$app.memo(Index)
