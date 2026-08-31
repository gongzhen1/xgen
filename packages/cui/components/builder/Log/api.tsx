import { createRoot } from 'react-dom/client'
import { createModalContainer } from '@/actions/utils'
import Log from './LogWindow'
import { ILog, LogTabItem } from './types'

export interface OpenLogOptions {
	logs: ILog
	title?: string
	tabItems?: LogTabItem[]
	/** 传入后日志组件自行从后端拉取/刷新/事件/时间快捷搜索 */
	source?: { type?: string }
}

// Store all log window roots for management
const logWindowRoots: Record<string, { root: ReturnType<typeof createRoot>; container: HTMLElement }> = {}

// Check if log window exists
export const isLogWindowOpen = (id: string): boolean => {
	return !!logWindowRoots[id]
}

export const openLogWindow = (id: string, options: OpenLogOptions) => {
	const containerId = 'log-' + id

	// If window already exists, just update the data
	if (logWindowRoots[id]) {
		const { root } = logWindowRoots[id]
		root.render(
			<Log
				id={id}
				logs={options.logs}
				title={options.title}
				tabItems={options.tabItems}
				source={options.source}
				onClose={() => {
					root.unmount()
					logWindowRoots[id].container.remove()
					delete logWindowRoots[id]
				}}
			/>
		)
		return
	}

	// Create new window
	const container = createModalContainer(containerId)
	const root = createRoot(container)

	// Store the references
	logWindowRoots[id] = { root, container }

	// Create a function to cleanup the DOM when the modal is closed
	const cleanup = () => {
		root.unmount()
		container.remove()
		delete logWindowRoots[id]
	}

	root.render(
		<Log
			id={id}
			logs={options.logs}
			title={options.title}
			tabItems={options.tabItems}
			source={options.source}
			onClose={cleanup}
		/>
	)
}

// Update existing log window data
export const updateLogData = (id: string, options: Partial<OpenLogOptions>) => {
	if (!options.logs) {
		console.warn('logs property is required when updating log window')
		return
	}

	if (!logWindowRoots[id]) {
		return
	}

	const { root } = logWindowRoots[id]
	root.render(
		<Log
			id={id}
			logs={options.logs}
			title={options.title}
			tabItems={options.tabItems}
			onClose={() => {
				root.unmount()
				logWindowRoots[id].container.remove()
				delete logWindowRoots[id]
			}}
		/>
	)
}
