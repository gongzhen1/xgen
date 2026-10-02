/**
 * react/jsx-runtime ESM 垫片
 * HeroUI 产物与用户页面均用 automatic JSX runtime 编译，这里桥接到宿主 React 18 的 createElement。
 * 同时兼容 React 19 语法：<Context value={...}> 直接把 Context 当 Provider 用，
 * React 18 需要 <Context.Provider>，在此统一改写（context 对象 $$typeof = 0xeace）。
 */
// 注入侧可能给真身或 ESM namespace，统一解包到 CJS module.exports 真身
const ns = window.__CustomPageRuntime.React
const React = ns && ns.default && ns.default.createElement ? ns.default : ns

export const Fragment = React.Fragment

// React 内部类型标记（createContext 返回对象的 $$typeof）
const REACT_CONTEXT_TYPE = 0xeace

function jsx(type, config, maybeKey) {
	const rest = {}
	let key = null
	if (maybeKey !== undefined && maybeKey !== null) key = '' + maybeKey
	if (config) {
		for (const name in config) {
			if (name !== 'key' && name !== 'ref' && name !== '__self' && name !== '__source') {
				rest[name] = config[name]
			}
		}
		if (config.key !== undefined && config.key !== null) key = '' + config.key
	}
	// React 19: <Context value={v}> → React 18: <Context.Provider value={v}>
	if (
		type !== null &&
		typeof type === 'object' &&
		type.$$typeof === REACT_CONTEXT_TYPE &&
		rest &&
		Object.prototype.hasOwnProperty.call(rest, 'value')
	) {
		type = type.Provider
	}
	// key 必须合进 props 对象——createElement(type, props, ...children) 的第三参起是 children，
	// 若写成 createElement(type, { key }, rest)，rest 会被误当作一个 child 导致渲染崩溃
	const props = key !== null ? { ...rest, key } : rest
	// 多个静态子节点会被 babel 编成 props.children 数组（jsxs）。若整体当作一个 child 传入，
	// React 无法把这些元素标记为已校验，协调时会误报 "Each child in a list should have a unique key"。
	// 必须按位置参数展开，与官方 jsx-runtime 的校验行为一致。
	const children = props.children
	if (Array.isArray(children)) {
		delete props.children
		return React.createElement(type, props, ...children)
	}
	return React.createElement(type, props)
}

export { jsx, jsx as jsxs, jsx as jsxDEV }
