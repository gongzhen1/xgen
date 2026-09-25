/**
 * React 19 兼容补丁：补回 antd 4 依赖但 React 19 已移除的 react-dom API
 * - ReactDOM.render / hydrate / unmountComponentAtNode
 * - ReactDOM.findDOMNode
 * 必须在应用最早期（global.ts 顶部）引入，确保 antd 等库加载前已打补丁。
 */
import React from 'react'
import ReactDOM from 'react-dom'
import { createRoot, hydrateRoot } from 'react-dom/client'

type AnyElement = Element | DocumentFragment

const roots = new WeakMap<AnyElement, ReturnType<typeof createRoot>>()

function patchRender(element: React.ReactElement, container: AnyElement, callback?: () => void) {
	let root = roots.get(container)
	if (!root) {
		root = createRoot(container)
		roots.set(container, root)
	}
	root.render(element)
	if (typeof callback === 'function') callback()
}

function patchHydrate(element: React.ReactElement, container: AnyElement, callback?: () => void) {
	let root = roots.get(container)
	if (!root) {
		root = hydrateRoot(container as Element, element as React.ReactNode)
		roots.set(container, root)
	}
	if (typeof callback === 'function') callback()
}

function patchUnmount(container: AnyElement): boolean {
	const root = roots.get(container)
	if (root) {
		root.unmount()
		roots.delete(container)
		return true
	}
	return false
}

// React 19 完全移除了 findDOMNode，没有公开替代；从 class 实例的 fiber 向下找宿主节点
const HOST_COMPONENT = 5
const HOST_TEXT = 6

/** 在 fiber 子树（含 sibling 链）中找第一个宿主节点（DOM 元素或文本） */
function findHostStateNode(fiber: any): Element | Text | null {
	let node = fiber
	while (node) {
		if (node.tag === HOST_COMPONENT || node.tag === HOST_TEXT) return node.stateNode
		if (node.child) {
			const found = findHostStateNode(node.child)
			if (found) return found
		}
		node = node.sibling
	}
	return null
}

function patchFindDOMNode(component: any): Element | Text | null {
	if (component == null) return null
	// 本身就是 DOM 节点
	if (component instanceof Element || component instanceof Text) return component as Element | Text
	if (typeof component === 'object') {
		if (component.nodeType === 1 || component.nodeType === 3) return component
		// class 组件实例：其 fiber 的 stateNode 是实例本身（不是 DOM），必须向下找 host 节点
		const fiber =
			(component as any)._reactInternals ||
			(component as any)._reactInternalFiber ||
			(component as any).__reactInternalInstance
		if (fiber) {
			if (fiber.tag === HOST_COMPONENT || fiber.tag === HOST_TEXT) return fiber.stateNode
			return findHostStateNode(fiber.child)
		}
	}
	return null
}

const rd = ReactDOM as any
if (typeof rd.render !== 'function') rd.render = patchRender
if (typeof rd.hydrate !== 'function') rd.hydrate = patchHydrate
if (typeof rd.unmountComponentAtNode !== 'function') rd.unmountComponentAtNode = patchUnmount
if (typeof rd.findDOMNode !== 'function') rd.findDOMNode = patchFindDOMNode

export {}
