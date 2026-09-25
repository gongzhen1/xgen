/**
 * react-dom ESM 垫片：复用宿主 ReactDOM 单例
 * 由 importmap 映射裸模块 "react-dom"
 */
// 注入侧可能给真身或 ESM namespace，统一解包到 CJS module.exports 真身
const ns = window.__CustomPageRuntime.ReactDOM
const ReactDOM = ns && ns.default && typeof ns.default.createPortal === 'function' ? ns.default : ns

export default ReactDOM
export const {
	createPortal,
	flushSync,
	render,
	hydrate,
	createRoot,
	hydrateRoot,
	unmountComponentAtNode,
	findDOMNode,
	version
} = ReactDOM
