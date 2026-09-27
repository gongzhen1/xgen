import { useEffect, useRef, useState } from 'react'
import { Input, Modal, message } from 'antd'
import Editor from 'react-monaco-editor'
import { useMemoizedFn } from 'ahooks'

const { TextArea } = Input

/** AI 系统技能规范（根据编辑器类型动态生成） */
function buildSystemSkill(fileType: string, isAdvanced: boolean): string {
	// 模式一：高级页面（React JSX 动态编译；默认 antd 全局注入，用户点名 HeroUI 时走 ESM import）
	if (fileType === 'page' && isAdvanced) {
		return (
			'你是 YAO 低代码平台「高级页面」开发助手。用户会用自然语言描述一个页面，你需要输出可直接在 CUI 框架中编译渲染的 React 代码。\n\n' +
			'【UI 库选择】\n' +
			'- 默认使用 antd 方案（规则 A，无 import，组件全局注入）\n' +
			'- 仅当用户明确提到 HeroUI / heroui 组件库时，使用 HeroUI 方案（规则 B，标准 ESM import）。两套方案不要混用风格\n\n' +
			'【输出格式（两种方案共同）】\n' +
			'只输出代码，用 ```tsx 围栏包裹，不要任何解释文字。代码必须是：export default function Page() { return (...) }\n' +
			'允许使用 TypeScript 类型语法（编译器会自动剥离），但禁止 import 除 react/react-dom/antd/@heroui/react 之外的任何模块\n\n' +
			'========== 规则 A：antd 方案（默认） ==========\n' +
			'【运行时环境】\n' +
			'- 无 import，无外部依赖，所有组件和 hooks 由运行时全局注入\n' +
			'- React 19 + antd 6，共享宿主实例\n' +
			'- 样式尽量不要用内联style可以把style抽成class css块，单独放到一块管理，做好缩减和格式化、不要用 styled-components/emotion\n\n' +
			'【可用 hooks】\n' +
			'useState, useEffect, useRef, useMemo, useCallback, useReducer\n\n' +
			'【可用组件（严格白名单，超出此列表的组件会报 is not defined）】\n' +
			'布局：Layout, Header, Content, Footer, Sider, Row, Col, Divider, Space\n' +
			'导航：Menu, Breadcrumb, Pagination, Steps, Anchor, BackTop, Dropdown\n' +
			'数据展示：Card, Table, DataTable, List, Tag, Avatar, Badge, Tooltip, Carousel, Collapse, Tabs, Descriptions, Timeline, Tree, Statistic, Image, Empty, Skeleton, Calendar\n' +
			'数据录入：Input, InputNumber, Select, Checkbox, Radio, Switch, DatePicker, TimePicker, Form, Upload, Rate, Slider, Mentions, Cascader, TreeSelect, AutoComplete, Transfer\n' +
			'反馈：Button, Alert, message, Modal, Drawer, Popconfirm, Popover, Progress, Result, Spin\n' +
			'排版：Typography（及其子组件 Title, Paragraph, Text, Link —— 已全局解构，可直接写 <Title>）\n' +
			'其他：ConfigProvider\n\n' +
			'【DataTable 数据表格用法（列宽/勾选/排序/表头筛选/单元格编辑/分页或无限滚动）】\n' +
			'- 基本写法：<DataTable data={rows} columns={columns} rowKey="id" loading={loading} size="small" />\n' +
			'- 只负责渲染，不发数据请求：data 由页面自行获取后传入；每行必须有 id（rowKey 默认取 record.id，取不到则退化成行索引）\n' +
			'- columns 对象数组：{ key, title, dataIndex, width?: number, align?: \'left|center|right\', render?: (value, record, index) => ReactNode }，不要写 import 类型\n' +
			'- 列宽：优先取 column.width，其次 columnWidths[列key]，两者都没有该列走 flex 自适应；columnWidthPreset="compact|normal|wide" 只对固定列名生效（scenario/source/query/context/score/created_at/actions），自定义列名必须自己给 width\n' +
			'- columnWidths={{ 列key: { width, minWidth, maxWidth, flex } }} 按列覆盖；autoFitColumns 只在「所有列都写了 width 且总宽小于容器」时把剩余宽度按比例补满，想让表格铺满整行就给每列写 width 再加 autoFitColumns\n' +
			'- size="small|middle|large"（默认 middle），行高 26/30/44px，Excel 风格紧凑表格用 small\n' +
			'- 行勾选：rowSelection={{ selectedRowKeys, onChange: (keys, rows) => {} }}，自动渲染勾选列（宽 40）+ 全选（含半选态）+ 选中行高亮\n' +
			'- 排序：column 加 sorter: true（只负责显示排序图标），真实排序必须页面自己实现，配合 sort={{ key, order: \'asc|desc\' }} 受控 + onSortChange={(key, order) => {}}（order 为 null 表示取消排序）\n' +
			'- 表头漏斗筛选：column 加 filter={{ type: \'text|set|range\', options: [\'a\',\'b\'] }}（set 用 options），配合 columnFilters 受控 + onColumnFilter={(key, value) => {}}；回传 value 形如 {type:\'text\',value}/{type:\'set\',values}/{type:\'range\',min,max}，过滤数据由页面实现\n' +
			'- 单元格点击编辑：column 加 editable={{ type: \'text|number|select|datetime\', options: [{label,value}], format }}，配合 onCellSave={(record, dataIndex, value) => {}}；点击进入编辑，Enter/失焦保存、Esc 取消，select/datetime 选完即保存（datetime 默认格式 YYYY-MM-DD HH:mm），number 自动取非负值\n' +
			'- actions={[{ key: \'delete\', label: \'删除\', onClick: (record, index) => {} }]} 自动追加「操作」列，渲染为图标按钮 + hover 提示（key 为 delete 自动标红），可用 disabled/visible 控制\n' +
			'- 顶部工具栏（关键字搜索框 + 下拉筛选 + 右侧「共 N 条」）必须靠 filters 驱动：filters={[{ key: \'status\', label: \'状态\', type: \'select\', options: [{label,value}], onChange }]}（type 只支持 select/search），配合 searchPlaceholder + onSearch 才显示搜索框；extraActions 也渲染在该工具栏右侧\n' +
			'- 内置分页：pagination={{ current, pageSize, total, onChange: (page, pageSize) => {} }}，渲染在表格底部；pagination={false} 关闭；pageSizeOptions 固定 [10,20,50]；无限滚动改用 hasMore + onLoadMore + loadingMore（与分页二选一）\n' +
			'- 空状态用 emptyText 自定义；loading 只在 data 为空时显示整块加载中，刷新已有数据时没有任何 loading 反馈\n' +
			'- 以下 props 声明了但未实现，禁止使用：bordered、showHeader、scroll、onRow、column.fixed、column.resizable、column.ellipsis（单元格默认就截断省略号）、pagination.showTotal、filter.type="dateRange"\n' +
			'【DataTable 最小示例骨架】\n' +
			'```tsx\n' +
			'export default function Page() {\n' +
			'  const [rows, setRows] = useState([{ id: 1, name: \'示例\', status: \'待处理\', qty: 3 }])\n' +
			'  const [selectedKeys, setSelectedKeys] = useState([])\n' +
			'  const columns = [\n' +
			'    { key: \'name\', title: \'名称\', dataIndex: \'name\', width: 220 },\n' +
			'    { key: \'status\', title: \'状态\', dataIndex: \'status\', width: 120, editable: { type: \'select\', options: [{ label: \'待处理\', value: \'待处理\' }] } },\n' +
			'    { key: \'qty\', title: \'数量\', dataIndex: \'qty\', width: 100, align: \'right\', editable: { type: \'number\' } }\n' +
			'  ]\n' +
			'  return (\n' +
			'    <div style={{ padding: 16 }}>\n' +
			'      <DataTable\n' +
			'        data={rows}\n' +
			'        columns={columns}\n' +
			'        rowKey="id"\n' +
			'        size="small"\n' +
			'        autoFitColumns\n' +
			'        rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}\n' +
			'        onCellSave={(record, dataIndex, value) =>\n' +
			'          setRows((prev) => prev.map((r) => (r.id === record.id ? { ...r, [dataIndex]: value } : r)))\n' +
			'        }\n' +
			'        pagination={false}\n' +
			'      />\n' +
			'    </div>\n' +
			'  )\n' +
			'}\n' +
			'```\n\n' +
			'【可用工具函数】\n' +
			'message.success/error/warning/info\n\n' +
			'【编码规范】\n' +
			'1. 只用白名单内的组件和 hooks，禁止使用 @ant-design/icons、moment、lodash 等任何未注入的库\n' +
			'2. 图标用内联 SVG 或文字/emoji 代替，不要用 <Icon /> 组件\n' +
			'3. 日期时间直接用 new Date()，不要用 moment/dayjs\n' +
			'4. 组件必须返回单个根元素（用 <div> 或 <Layout> 包裹）\n' +
			'5. 不要写 export 其他东西，只 export default 一个组件\n' +
			'6. 不要在组件顶层调用 hooks，必须在函数体内\n' +
			'7. 事件处理器用 onClick={() => {}}，不要在 JSX 里写复杂逻辑\n\n' +
			'【配色建议】\n' +
			'主色 #1677ff，背景 #f5f7fa，文字 #1f2937，辅助文字 #6b7280，边框 #e5e7eb\n\n' +
			'========== 规则 B：HeroUI 方案（用户点名时） ==========\n' +
			'【运行时环境】\n' +
			'- HeroUI v3 + React 19，标准 ESM：组件必须用 import 从 \'@heroui/react\' 引入，hooks 从 \'react\' 引入\n' +
			'- 组件样式由平台自动注入，禁止 import 任何 css 文件；无需 Provider 包裹\n' +
			'- 如需混用 antd 组件，可 import { 组件名 } from \'antd\'（antd 6）\n\n' +
			'【可用组件（严格白名单，仅这些已按需构建，写其他组件会运行时报错）】\n' +
			'手风琴/折叠：Accordion, Disclosure, DisclosureGroup\n' +
			'按钮：Button, ButtonGroup, CloseButton, ToggleButton, ToggleButtonGroup\n' +
			'卡片/容器：Card, Surface, EmptyState, Separator, ScrollShadow\n' +
			'表单：Form, Fieldset, Label, Description, FieldError, ErrorMessage, TextField, Input, TextArea, InputGroup, SearchField, NumberField, Select, ComboBox, Autocomplete, Checkbox, CheckboxGroup, Radio, RadioGroup, Switch, Slider, DateField, DatePicker, DateRangePicker, TimeField, Calendar, InputOTP\n' +
			'反馈：Alert, AlertDialog, Modal, Drawer, Popover, Tooltip, ProgressBar, ProgressCircle, Spinner, Skeleton, Meter\n' +
			'导航：Breadcrumbs, Link, Menu, Dropdown, Pagination, Tabs, Toolbar\n' +
			'数据展示：Table, ListBox, Avatar, AvatarGroup, Badge, Chip, Tag, TagGroup, Kbd, Typography\n\n' +
			'【事件与受控写法（React Aria 风格，与 DOM/antd 不同，务必遵守）】\n' +
			'- Button 用 onPress，不是 onClick：<Button variant="primary" onPress={() => {}}>\n' +
			'- TextField 受控直接给值（不是 event）：<TextField value={v} onChange={setV}>，且 Input 必须作为 TextField 的子组件使用\n' +
			'- Switch 受控：<Switch isSelected={v} onChange={setV}>，必须含复合子结构（见下方复合组件）\n' +
			'- Tabs 受控：<Tabs selectedKey={k} onSelectionChange={(key) => setK(String(key))}>\n' +
			'- Select 受控：selectedKey + onSelectionChange(key)\n\n' +
			'【复合组件点写法（必须按此结构，缺子结构不渲染）】\n' +
			'- Card：<Card><Card.Header><Card.Title>标题</Card.Title><Card.Description>描述</Card.Description></Card.Header><Card.Content>内容</Card.Content><Card.Footer>底部</Card.Footer></Card>（注意是 Content 不是 Body）\n' +
			'- Switch：<Switch isSelected={v} onChange={setV}><Switch.Control><Switch.Thumb /></Switch.Control><Switch.Content>文字</Switch.Content></Switch>\n' +
			'- Tabs：<Tabs><Tabs.List><Tabs.Tab id="a">标签A</Tabs.Tab></Tabs.List><Tabs.Panel id="a">内容A</Tabs.Panel></Tabs>\n' +
			'- 同类还有 Accordion.Item、Breadcrumbs.Item、Menu.Item、ListBox.Item、TagGroup.List 等\n\n' +
			'【HeroUI 编码规范】\n' +
			'1. 布局与间距必须用内联 style（如 style={{ display:\'flex\', gap:12, padding:16 }}）；平台未集成 Tailwind 工具类，禁止使用 flex/gap-4/p-4 等 class 名\n' +
			'2. 颜色与变体用组件自带 props：Button 用 variant="primary|outline|danger|ghost"；Chip/Tag/Badge 用 color="default|primary|accent|success|warning|danger|tertiary"\n' +
			'3. 图标用内联 SVG，禁止任何图标库；日期用 new Date()；禁止 lodash/moment/dayjs\n' +
			'4. 只 export default 一个页面组件；组件必须返回单个根元素；hooks 只在组件函数体内调用\n\n' +
			'【HeroUI 示例骨架】\n' +
			'```tsx\n' +
			'import { useState } from \'react\'\n' +
			'import { Button, Card, TextField, Input, Chip } from \'@heroui/react\'\n\n' +
			'export default function Page() {\n' +
			'  const [name, setName] = useState(\'\')\n' +
			'  return (\n' +
			'    <div style={{ padding: 24, display: \'flex\', flexDirection: \'column\', gap: 16 }}>\n' +
			'      <Card>\n' +
			'        <Card.Header>\n' +
			'          <Card.Title>示例</Card.Title>\n' +
			'        </Card.Header>\n' +
			'        <Card.Content style={{ display: \'flex\', gap: 12, alignItems: \'center\' }}>\n' +
			'          <TextField value={name} onChange={setName}>\n' +
			'            <Input placeholder=\'请输入名称\' />\n' +
			'          </TextField>\n' +
			'          <Button variant=\'primary\' onPress={() => console.log(name)}>提交</Button>\n' +
			'          <Chip color=\'accent\'>{name || \'未输入\'}</Chip>\n' +
			'        </Card.Content>\n' +
			'      </Card>\n' +
			'    </div>\n' +
			'  )\n' +
			'}\n' +
			'```'
		)
	}

	// 模式二：YAO 引擎脚本（v8go JS）
	if (fileType === 'script') {
		return (
			'你是 YAO 低代码平台的脚本开发助手。用户会用自然语言描述需求，你需要输出可在 YAO 引擎 v8go 运行时中执行的 JavaScript 脚本。\n\n' +
			'【输出格式】\n' +
			'只输出代码，用 ```javascript 围栏包裹，不要任何解释文字。\n\n' +
			'【运行时环境】\n' +
			'- v8go 运行时，纯 JavaScript（ES6+），支持 async/await、Promise\n' +
			'- 脚本中的 function 会被注册为处理器，可被 API/Flow/Table 等通过 process 字段调用\n' +
			'- 全局内置对象：Process（调用其他处理器）、Exception（抛异常）\n\n' +
			'【Process 调用】\n' +
			'格式：Process(\'处理器名称\', ...参数)\n' +
			'常用处理器：\n' +
			'  · models.{Model}.Get(id) —— 按主键查单条\n' +
			'  · models.{Model}.Find(query) —— 按条件查单条\n' +
			'  · models.{Model}.Get({limit, wheres, orders, withs}) —— 列表查询\n' +
			'  · models.{Model}.Paginate({page, pagesize, wheres, withs}) —— 分页查询\n' +
			'  · models.{Model}.Save(data) —— 保存（有 id 更新，无 id 新增）\n' +
			'  · models.{Model}.Delete(id) —— 按主键删除\n' +
			'  · models.{Model}.DeleteWhere(wheres) —— 按条件删除\n' +
			'  · table.{Name}.Setting() / Search(query) / Find(id) / Save(data) / Delete(id) —— 表格数据\n' +
			'  · flow.{Flow}.Run(args) —— 运行流程\n' +
			'  · query.Select(sql, params) / query.Run(sql, params) —— 原生 SQL 查询/执行\n' +
			'  · cache.Get(key) / Set(key, value, ttl) / Del(key) —— 缓存\n' +
			'  · session.Get(key) / Set(key, value) / Del(key) —— 会话\n' +
			'  · fs.ReadFile(path) / WriteFile(path, data) / Exists(path) —— 文件\n' +
			'  · http.Get(url, headers) / Post(url, body, headers) —— HTTP 请求\n' +
			'  · env.get(name) —— 获取环境变量\n' +
			'  · str.Format(fmt, ...args) / Join(arr, sep) / Split(str, sep) —— 字符串\n' +
			'  · time.Now() / Format(ts, layout) / Parse(str, layout) —— 时间\n' +
			'  · log.Info(msg) / Error(msg) / Warn(msg) —— 日志\n' +
			'  · utils.Md5(str) / Base64Encode(str) / Base64Decode(str) / UUID() —— 工具函数\n' +
			'  · scripts.{FileName}.{FuncName}(...args) —— 调用其他脚本文件的函数\n\n' +
			'【异常处理】\n' +
			'- 用 throw new Exception(\'错误消息\', 状态码) 抛出业务异常，会被框架捕获返回给调用方\n' +
			'- 状态码可选，默认 500；常用 400(参数错误)、403(无权限)、404(不存在)\n' +
			'- catch 中用 e.message 获取错误文本，用 e.code 获取状态码\n' +
			'- 开发调试时可临时用 throw new Error(...) 获取完整 JS 堆栈\n\n' +
			'【编码规范】\n' +
			'1. 用 function 声明导出函数，函数名即处理器名（如 function GetUserList(){}）\n' +
			'2. 函数参数由调用方传入，第一个参数通常是 name（字符串标识），后续为业务参数\n' +
			'3. 禁止 import/require，所有依赖通过 Process 调用\n' +
			'4. 禁止使用 Node.js 内置模块（fs/path/https/crypto 等），用 yao 对应处理器替代\n' +
			'5. 异步操作用 async/await，Process 本身是同步的，不需要 await\n' +
			'6. 返回值会被 JSON 序列化后返回给调用方\n' +
			'7. 脚本间互相调用：Process(\'scripts.文件名.函数名\', ...参数)\n\n' +
			'【示例】\n' +
			'```javascript\n' +
			'// 查询用户列表（分页）\n' +
			'function GetUserList(name, page, pageSize) {\n' +
			'  const wheres = [];\n' +
			'  if (name) wheres.push({ field: \'name\', op: \'like\', value: `%${name}%` });\n' +
			'  return Process(\'models.user.Paginate\', {\n' +
			'    wheres,\n' +
			'    page: page || 1,\n' +
			'    pagesize: pageSize || 10\n' +
			'  });\n' +
			'}\n\n' +
			'// 创建用户（带异常处理）\n' +
			'function CreateUser(name, email) {\n' +
			'  if (!name || !email) throw new Exception(\'姓名和邮箱必填\', 400);\n' +
			'  const exists = Process(\'models.user.Find\', { wheres: [{ field: \'email\', op: \'=\', value: email }] });\n' +
			'  if (exists) throw new Exception(\'邮箱已存在\', 409);\n' +
			'  return Process(\'models.user.Save\', { name, email, created_at: new Date().toISOString() });\n' +
			'}\n' +
			'```'
		)
	}

	// 模式三：页面 DSL（Xgen Table / Form 标准 JSON）
	return (
		'你是 YAO 低代码平台的 Xgen 页面 DSL 配置助手。用户会用自然语言描述一个管理页面，你需要输出 Xgen 框架的 DSL JSON 配置（Table 表格页或 Form 表单页）。\n\n' +
		'【输出格式】\n' +
		'只输出 JSON，用 ```json 围栏包裹，不要任何解释文字。\n\n' +
		'【Table 表格页 DSL 结构】\n' +
		'{\n' +
		'  "name": "表格名称",          // 表格名称\n' +
		'  "version": "1.0.0",           // 版本号\n' +
		'  "bind": {                     // 绑定数据模型（自动生成 apis/columns/filters）\n' +
		'    "model": "user",\n' +
		'    "withs": { "关联名": { "query": { "select": ["id","name"] } } }\n' +
		'  },\n' +
		'  "apis": {                     // 管理接口（可覆盖自动生成的）\n' +
		'    "search": { "process": "models.user.Paginate", "default": [null, null, 15] },\n' +
		'    "find":   { "process": "models.user.Find" },\n' +
		'    "save":   { "process": "models.user.Save" },\n' +
		'    "delete": { "process": "models.user.Delete" }\n' +
		'  },\n' +
		'  "columns": {                  // 字段呈现方式\n' +
		'    "字段key": {\n' +
		'      "label": "显示名称",\n' +
		'      "view": { "type": "label", "props": { "value": ":字段名" } },   // 列表展示\n' +
		'      "edit": { "type": "input", "props": { "value": ":字段名" } },   // 行内编辑\n' +
		'      "form": { "type": "input", "props": { "value": ":字段名" } }    // 表单编辑\n' +
		'    }\n' +
		'  },\n' +
		'  "filters": {},                // 查询过滤器\n' +
		'  "list": {},                   // 列表页配置\n' +
		'  "edit": {},                   // 编辑页配置\n' +
		'  "view": {},                   // 查看页配置\n' +
		'  "insert": {}                  // 批量录入页配置\n' +
		'}\n\n' +
		'【Form 表单页 DSL 结构】\n' +
		'{\n' +
		'  "name": "表单名称",\n' +
		'  "action": {\n' +
		'    "bind": { "model": "user", "option": { "withs": {} } },\n' +
		'    "find": { "process": "models.user.Find" },   // 查单条\n' +
		'    "save": { "process": "models.user.Save" }    // 保存\n' +
		'  },\n' +
		'  "columns": {                  // 字段定义\n' +
		'    "字段key": {\n' +
		'      "label": "显示名称",\n' +
		'      "edit": { "type": "input", "props": { "value": ":字段名" } }\n' +
		'    }\n' +
		'  },\n' +
		'  "layout": {}                  // 布局配置\n' +
		'}\n\n' +
		'【常用控件 type】\n' +
		'展示类（view）：label（文本）、tag（标签）、image（图片）、date（日期）、switch（开关）\n' +
		'编辑类（edit/form）：input（输入框）、textarea（多行）、select（下拉，可配 remote 远程）、date（日期）、switch（开关）、checkbox、radio、upload（上传）、image（图片上传）\n\n' +
		'【数据绑定】\n' +
		'- props.value 用冒号前缀绑定数据字段，如 "value": ":name" 绑定 name 字段\n' +
		'- 远程下拉："remote": { "api": "/api/xxx/get", "query": { "select": ["id","name"] } }\n' +
		'- 条件绑定用 {{变量}} 模板语法\n\n' +
		'【编码规范】\n' +
		'1. 输出必须是合法 JSON，不要有注释和尾随逗号\n' +
		'2. 优先使用 bind.model 绑定模型，框架会自动生成 apis/columns/filters，只需覆盖特殊配置\n' +
		'3. columns 的 key 必须与模型字段名一致\n' +
		'4. 自定义处理器用 process 字段指定，如 "process": "scripts.user.Save"\n' +
		'5. guard 字段设置鉴权中间件，"-" 表示不鉴权\n' +
		'6. 不要在 JSON 中写 JS 代码，逻辑放在 scripts/*.js 中通过 process 调用\n' +
		'7. Table 页必须有 list 和 edit，Form 页必须有 action\n\n' +
		'【示例 - 用户管理表格页】\n' +
		'```json\n' +
		'{\n' +
		'  "name": "用户管理",\n' +
		'  "version": "1.0.0",\n' +
		'  "bind": { "model": "user" },\n' +
		'  "columns": {\n' +
		'    "name": { "label": "姓名", "view": { "type": "label", "props": { "value": ":name" } }, "edit": { "type": "input", "props": { "value": ":name" } } },\n' +
		'    "email": { "label": "邮箱", "view": { "type": "label", "props": { "value": ":email" } }, "edit": { "type": "input", "props": { "value": ":email" } } },\n' +
		'    "status": { "label": "状态", "view": { "type": "tag", "props": { "value": ":status" } }, "edit": { "type": "switch", "props": { "value": ":status" } } }\n' +
		'  },\n' +
		'  "list": {},\n' +
		'  "edit": {}\n' +
		'}\n' +
		'```'
	)
}

interface Message {
	role: 'user' | 'assistant'
	content: string
}

interface AiConfig {
	baseUrl: string
	model: string
	key: string
}

const DEFAULT_CONFIG: AiConfig = {
	baseUrl: 'https://api.deepseek.com',
	model: 'deepseek-v4-flash',
	key: 'sk-xxx'
}

const CONFIG_KEY = 'ai-editor-config'

/** 清理配置中的非法字符（反引号、首尾空格等） */
function sanitizeConfig(cfg: AiConfig): AiConfig {
	return {
		baseUrl: String(cfg.baseUrl || '').replace(/[`\s]/g, '').trim(),
		model: String(cfg.model || '').trim(),
		key: String(cfg.key || '').trim()
	}
}

function loadConfig(): AiConfig {
	try {
		const raw = localStorage.getItem(CONFIG_KEY)
		if (raw) return sanitizeConfig({ ...DEFAULT_CONFIG, ...JSON.parse(raw) })
	} catch {}
	return DEFAULT_CONFIG
}

function saveConfig(cfg: AiConfig) {
	localStorage.setItem(CONFIG_KEY, JSON.stringify(sanitizeConfig(cfg)))
}

/** 从 AI 回复中提取代码：优先取最长的 fenced 代码块内容 */
function extractCode(raw: string): string {
	const fences = [...raw.matchAll(/```[\w]*\n([\s\S]*?)```/g)].map((m) => m[1])
	if (fences.length > 0) {
		return fences.reduce((a, b) => (b.length > a.length ? b : a))
	}
	// 没有围栏时，去掉可能存在的首尾 ```
	return raw.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim()
}

/**
 * 复制文本到剪贴板。
 * navigator.clipboard 只在安全上下文（https 或 localhost）存在，
 * 通过 http://ip:port 访问时它是 undefined，必须退回 execCommand。
 */
async function copyToClipboard(text: string): Promise<boolean> {
	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(text)
			return true
		}
	} catch {
		// 权限被拒或非安全上下文，继续走下面的兜底方案
	}

	const el = document.createElement('textarea')
	el.value = text
	el.readOnly = true
	// 移出视口且不可聚焦滚动，避免 iOS 弹出键盘
	el.style.position = 'fixed'
	el.style.top = '-9999px'
	document.body.appendChild(el)
	try {
		el.select()
		return document.execCommand('copy')
	} catch {
		return false
	} finally {
		document.body.removeChild(el)
	}
}

/** 代码块配色（One Dark 风格，与参考图 / 面板暗色主题统一） */
const CODE_FONT = 'Menlo, Monaco, Consolas, "Courier New", monospace'
const CODE_COLORS = {
	bg: '#1e242f',
	border: '#2e3545',
	text: '#d1d3db',
	icon: '#9aa4b2',
	iconHover: '#7bb8ff'
}

const LANG_LABEL: Record<string, string> = {
	tsx: 'TSX',
	ts: 'TS',
	typescript: 'TS',
	jsx: 'JSX',
	js: 'JS',
	javascript: 'JS',
	json: 'JSON',
	css: 'CSS',
	html: 'HTML',
	yaml: 'YAML',
	yml: 'YAML',
	md: 'MD'
}

/** 围栏语言 → Monaco 语言 id（不支持的一律纯文本） */
const MONACO_LANG: Record<string, string> = {
	tsx: 'typescript',
	ts: 'typescript',
	typescript: 'typescript',
	jsx: 'javascript',
	js: 'javascript',
	javascript: 'javascript',
	json: 'json',
	css: 'css',
	html: 'html',
	yaml: 'yaml',
	yml: 'yaml',
	md: 'markdown'
}

// Monaco 编辑器：行号 / 语法高亮 / 横向滚动全部交给编辑器组件自身，避免手写渲染行号错位
const AI_CODE_THEME = 'ai-code-dark'
let aiCodeThemeReady = false

function defineAiCodeTheme(monaco: any) {
	if (aiCodeThemeReady) return
	monaco.editor.defineTheme(AI_CODE_THEME, {
		base: 'vs-dark',
		inherit: true,
		rules: [
			{ token: '', foreground: 'd1d3db' },
			{ token: 'comment', foreground: '7f848e', fontStyle: 'italic' },
			{ token: 'keyword', foreground: 'c678dd' },
			{ token: 'keyword.control', foreground: 'c678dd' },
			{ token: 'keyword.operator', foreground: 'c678dd' },
			{ token: 'string', foreground: '98c379' },
			{ token: 'string.escape', foreground: '56b6c2' },
			{ token: 'number', foreground: 'd19a66' },
			{ token: 'constant', foreground: 'd19a66' },
			{ token: 'type', foreground: 'e5c07b' },
			{ token: 'type.identifier', foreground: 'e5c07b' },
			{ token: 'class', foreground: 'e5c07b' },
			{ token: 'function', foreground: '61afef' },
			{ token: 'tag', foreground: 'e06c75' },
			{ token: 'attribute.name', foreground: 'd19a66' }
		],
		colors: {
			'editor.background': CODE_COLORS.bg,
			'editor.foreground': CODE_COLORS.text,
			'editorLineNumber.foreground': '#4b5263',
			'editorLineNumber.activeForeground': '#7f848e',
			'editor.lineHighlightBackground': '#00000000',
			'editor.lineHighlightBorder': '#00000000',
			'editor.selectionBackground': '#3e4451',
			'editorGutter.background': CODE_COLORS.bg,
			'editorOverviewRuler.border': '#00000000',
			'editorIndentGuide.background1': '#00000000',
			'editorIndentGuide.activeBackground1': '#00000000'
		}
	})
	aiCodeThemeReady = true
}

/** Monaco 在 420px 面板里只读渲染的固定配置 */
const AI_EDITOR_OPTIONS = {
	readOnly: true,
	domReadOnly: true,
	automaticLayout: true,
	contextmenu: false,
	minimap: { enabled: false },
	lineNumbers: 'on' as const,
	lineNumbersMinChars: 3,
	lineDecorationsWidth: 10,
	glyphMargin: false,
	folding: false,
	lineHeight: 18,
	fontSize: 12,
	fontFamily: CODE_FONT,
	tabSize: 2,
	wordWrap: 'off' as const,
	scrollBeyondLastLine: false,
	renderLineHighlight: 'none' as const,
	overviewRulerLanes: 0,
	hideCursorInOverviewRuler: true,
	overviewRulerBorder: false,
	occurrencesHighlight: false,
	selectionHighlight: false,
	renderWhitespace: 'none' as const,
	guides: { indentation: false },
	stickyScroll: { enabled: false },
	padding: { top: 8, bottom: 8 },
	scrollbar: {
		verticalScrollbarSize: 8,
		horizontalScrollbarSize: 8,
		useShadows: false,
		alwaysConsumeMouseWheel: false
	}
}

/** 把 AI 回复切成「文本 / 代码块」片段：说明文字保留，代码块单独用编辑器框渲染 */
function splitContent(raw: string): { type: 'text' | 'code'; lang: string; value: string }[] {
	const parts: { type: 'text' | 'code'; lang: string; value: string }[] = []
	// 末尾用 $ 兼容流式输出中还没闭合的围栏
	const re = /```([\w+-]*)\s*\n([\s\S]*?)(?:```|$)/g
	let last = 0
	let m: RegExpExecArray | null
	while ((m = re.exec(raw)) !== null) {
		const before = raw.slice(last, m.index).trim()
		if (before) parts.push({ type: 'text', lang: '', value: before })
		parts.push({ type: 'code', lang: (m[1] || '').toLowerCase(), value: m[2].replace(/\n$/, '') })
		last = m.index + m[0].length
	}
	const rest = raw.slice(last).trim()
	if (rest) parts.push({ type: 'text', lang: '', value: rest })
	return parts
}

/** 代码块：编辑器风格外框（语言徽标 + 行号 + 复制 / 插入到编辑器） */
const CodeBlock = ({
	lang,
	code,
	onCopy,
	onInsert
}: {
	lang: string
	code: string
	onCopy: () => void
	onInsert: () => void
}) => {
	// 编辑器高度按行数撑开（1 行 18px），超过 320px 交给 Monaco 内部滚动
	const height = Math.min(Math.max(code.split('\n').length * 18 + 16, 64), 320)
	const iconStyle: React.CSSProperties = { cursor: 'pointer', display: 'block', color: CODE_COLORS.icon }
	return (
		<div
			style={{
				background: CODE_COLORS.bg,
				border: `1px solid ${CODE_COLORS.border}`,
				borderRadius: 8,
				overflow: 'hidden'
			}}
		>
			{/* 头部：左侧语言徽标（齿轮） + 右侧复制 / 插入到编辑器 */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					height: 34,
					padding: '0 10px'
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<svg
						width='14'
						height='14'
						viewBox='0 0 24 24'
						fill='none'
						stroke={CODE_COLORS.iconHover}
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
						style={{ display: 'block', flexShrink: 0 }}
					>
						<path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' />
						<circle cx='12' cy='12' r='3' />
					</svg>
					<span style={{ fontFamily: CODE_FONT, fontSize: 12, fontWeight: 600, color: '#c7c9d1' }}>
						{LANG_LABEL[lang] || (lang ? lang.toUpperCase() : 'CODE')}
					</span>
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					<svg
						width='15'
						height='15'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
						style={iconStyle}
						onMouseEnter={(e) => (e.currentTarget.style.color = CODE_COLORS.iconHover)}
						onMouseLeave={(e) => (e.currentTarget.style.color = CODE_COLORS.icon)}
						onClick={onCopy}
					>
						<title>复制</title>
						<rect x='2' y='8' width='14' height='14' rx='2' />
						<path d='M8 6V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2' />
					</svg>
					<svg
						width='15'
						height='15'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
						style={iconStyle}
						onMouseEnter={(e) => (e.currentTarget.style.color = CODE_COLORS.iconHover)}
						onMouseLeave={(e) => (e.currentTarget.style.color = CODE_COLORS.icon)}
						onClick={onInsert}
					>
						<title>插入到编辑器</title>
						<path d='M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3' />
						<path d='M2 12h9' />
						<path d='m8 9 3 3-3 3' />
					</svg>
				</div>
			</div>
			{/* 主体：交给 Monaco（行号、语法高亮、滚动都由编辑器自己负责） */}
			<Editor
				width='100%'
				height={height}
				language={MONACO_LANG[lang] || 'plaintext'}
				theme={AI_CODE_THEME}
				value={code}
				editorWillMount={defineAiCodeTheme}
				options={AI_EDITOR_OPTIONS}
			/>
		</div>
	)
}

interface AiPanelProps {
	open: boolean
	onClose: () => void
	/** 获取当前编辑器代码 */
	getCurrentCode: () => string
	/** 将代码插入编辑器 */
	onInsertCode: (code: string) => void
	/** 文件类型：script（yao脚本）/ page（页面DSL或高级页面） */
	fileType: string
	/** 是否为高级页面（React JSX） */
	isAdvanced: boolean
}

const AiPanel = ({ open, onClose, getCurrentCode, onInsertCode, fileType, isAdvanced }: AiPanelProps) => {
	const [config, setConfig] = useState<AiConfig>(() => loadConfig())
	const [configOpen, setConfigOpen] = useState(false)
	const [input, setInput] = useState('')
	const [messages, setMessages] = useState<Message[]>([])
	const [streaming, setStreaming] = useState(false)
	const [injectCode, setInjectCode] = useState(true)

	const messagesRef = useRef<Message[]>([])
	const streamAbortRef = useRef<AbortController | null>(null)
	const scrollRef = useRef<HTMLDivElement>(null)

	// 同步 messages 到 ref，避免闭包过期
	const pushMessages = useMemoizedFn((updater: (prev: Message[]) => Message[]) => {
		setMessages((prev) => {
			const next = updater(prev)
			messagesRef.current = next
			return next
		})
	})

	useEffect(() => {
		messagesRef.current = messages
	}, [messages])

	// 滚动到底部
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight
		}
	}, [messages, streaming])

	const handleSend = useMemoizedFn(async () => {
		const text = input.trim()
		if (!text || streaming) return
		const cfg = sanitizeConfig(config)
		if (!cfg.key) {
			message.warning('请先点击齿轮配置 API Key')
			setConfigOpen(true)
			return
		}

		setInput('')
		pushMessages((prev) => [...prev, { role: 'user', content: text }])
		setStreaming(true)

		const controller = new AbortController()
		streamAbortRef.current = controller

		// 构建请求消息：system 技能 + 可选注入当前代码
		const requestMessages: { role: string; content: string }[] = [
			{ role: 'system', content: buildSystemSkill(fileType, isAdvanced) }
		]
		if (injectCode) {
			const code = getCurrentCode()
			if (code && code.trim()) {
				requestMessages.push({
					role: 'system',
					content: `当前编辑器中的代码为:\n\`\`\`\n${code}\n\`\`\`\n请基于此代码执行用户的修改或补全要求，输出完整可运行的代码。`
				})
			}
		}
		// 历史消息（跳过空的 assistant 消息）
		for (const m of messagesRef.current) {
			if (m.role === 'assistant' && !m.content.trim()) continue
			requestMessages.push({ role: m.role, content: m.content })
		}
		requestMessages.push({ role: 'user', content: text })

		let assistantContent = ''
		pushMessages((prev) => [...prev, { role: 'assistant', content: '' }])

		try {
			const resp = await fetch('/api/ai/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${cfg.key}`
				},
				body: JSON.stringify({
					baseUrl: cfg.baseUrl,
					model: cfg.model,
					messages: requestMessages,
					stream: true
				}),
				signal: controller.signal
			})

			if (!resp.ok) {
				const errText = await resp.text()
				throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 200)}`)
			}

			const reader = resp.body?.getReader()
			if (!reader) throw new Error('无法读取响应流')

			const decoder = new TextDecoder()
			let buffer = ''

			while (true) {
				const { done, value } = await reader.read()
				if (done) break
				buffer += decoder.decode(value, { stream: true })

				const lines = buffer.split('\n')
				buffer = lines.pop() || ''

				for (const line of lines) {
					const trimmed = line.trim()
					if (!trimmed.startsWith('data:')) continue
					const data = trimmed.slice(5).trim()
					if (data === '[DONE]') continue
					try {
						const obj = JSON.parse(data)
						const delta = obj.choices?.[0]?.delta?.content
						if (delta) {
							assistantContent += delta
							// 更新最后一条 assistant 消息
							pushMessages((prev) => {
								const next = [...prev]
								next[next.length - 1] = { role: 'assistant', content: assistantContent }
								return next
							})
						}
					} catch {
						// 忽略不完整的 JSON
					}
				}
			}

			// 流结束但无内容：上游请求失败（如 baseUrl/model 错误）
			if (!assistantContent.trim()) {
				throw new Error('上游接口无响应，请检查 baseUrl 和 model 配置是否正确')
			}
		} catch (err: any) {
			if (err.name === 'AbortError') {
				assistantContent += '\n[已停止]'
			} else {
				assistantContent += `\n[错误: ${err?.message || String(err)}]`
			}
			pushMessages((prev) => {
				const next = [...prev]
				next[next.length - 1] = { role: 'assistant', content: assistantContent }
				return next
			})
		} finally {
			setStreaming(false)
			streamAbortRef.current = null
		}
	})

	const handleStop = useMemoizedFn(() => {
		streamAbortRef.current?.abort()
	})

	/** 直接插入一段代码（代码块头部图标用，内容已是纯代码） */
	const insertRaw = useMemoizedFn((code: string) => {
		if (!code.trim()) {
			message.warning('未检测到代码内容')
			return
		}
		onInsertCode(code)
	})

	/** 直接复制一段代码 */
	const copyRaw = useMemoizedFn(async (code: string) => {
		if (await copyToClipboard(code)) message.success('已复制')
		else message.error('复制失败，请手动选中复制')
	})

	/** 整条消息插入：从回复里抽取围栏代码 */
	const handleInsert = useMemoizedFn((content: string) => {
		const code = extractCode(content)
		if (!code) {
			message.warning('未检测到代码内容')
			return
		}
		onInsertCode(code)
	})

	/** 整条消息复制：从回复里抽取围栏代码 */
	const handleCopy = useMemoizedFn(async (content: string) => {
		if (await copyToClipboard(extractCode(content))) message.success('已复制')
		else message.error('复制失败，请手动选中复制')
	})

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSend()
		}
	}

	const handleSaveConfig = () => {
		saveConfig(config)
		setConfigOpen(false)
		message.success('配置已保存')
	}

	return (
		<>
			<style>{`@keyframes ai-spin { to { transform: rotate(360deg); } }`}</style>
		<div
			style={{
				position: 'absolute',
				top: 0,
				bottom: 0,
				right: 0,
				width: open ? 420 : 0,
				overflow: 'hidden',
				transition: 'width 0.25s ease',
				background: '#1e1e1e',
				color: '#e6e6e6',
				display: 'flex',
				flexDirection: 'column',
				zIndex: 20,
				borderLeft: open ? '1px solid #333' : 'none'
			}}
		>
			{/* 头部 */}
			<div
				style={{
					height: 48,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '0 16px',
					background: '#252525',
					borderBottom: '1px solid #1677ff33',
					flexShrink: 0
				}}
			>
				<span style={{ fontSize: 14, fontWeight: 600, color: '#e6e6e6' }}>AI 助手</span>
				<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					<svg
						width='18'
						height='18'
						viewBox='0 0 24 24'
						fill='none'
						stroke='#aaa'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
						style={{ cursor: 'pointer', transition: 'stroke 0.2s' }}
						onMouseEnter={(e) => (e.currentTarget.style.stroke = '#1677ff')}
						onMouseLeave={(e) => (e.currentTarget.style.stroke = '#aaa')}
						onClick={() => setConfigOpen(true)}
					>
						<circle cx='12' cy='12' r='3' />
						<path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' />
					</svg>
					<svg
						width='18'
						height='18'
						viewBox='0 0 24 24'
						fill='none'
						stroke='#aaa'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
						style={{ cursor: 'pointer', transition: 'stroke 0.2s' }}
						onMouseEnter={(e) => (e.currentTarget.style.stroke = '#ff6b6b')}
						onMouseLeave={(e) => (e.currentTarget.style.stroke = '#aaa')}
						onClick={onClose}
					>
						<line x1='18' y1='6' x2='6' y2='18' />
						<line x1='6' y1='6' x2='18' y2='18' />
					</svg>
				</div>
			</div>

			{/* 消息区 */}
			<div
				ref={scrollRef}
				style={{
					flex: 1,
					overflowY: 'auto',
					padding: 16,
					display: 'flex',
					flexDirection: 'column',
					gap: 16
				}}
			>
				{messages.length === 0 && (
					<div style={{ textAlign: 'center', color: '#888', marginTop: 60 }}>
						<div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
						<div>输入需求，让 AI 帮你生成代码</div>
					</div>
				)}

				{messages.map((msg, idx) => {
					// 助手回复按「说明文字 / 代码块」分区：代码块用编辑器框渲染，说明文字保持原文
					const parts = msg.role === 'assistant' ? splitContent(msg.content) : []
					const hasCode = parts.some((p) => p.type === 'code')
					return (
					<div
						key={idx}
						style={{
							maxWidth: msg.role === 'user' ? '80%' : 'calc(100% - 16px)',
							width: msg.role === 'assistant' ? 'calc(100% - 16px)' : 'auto',
							alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
							background: msg.role === 'user' ? '#1677ff' : '#2a2a2a',
							color: '#e6e6e6',
							borderRadius: 8,
							padding: hasCode ? '10px 10px 10px 12px' : '10px 12px',
							fontSize: 13,
							lineHeight: 1.6,
							wordBreak: 'break-word'
						}}
					>
						{/* 纯文本回复才在气泡内保留操作图标（有代码块时图标移到代码框头部）；生成中始终保留停止按钮 */}
						{msg.role === 'assistant' && (!hasCode || (streaming && idx === messages.length - 1)) && (
							<div
								style={{
									display: 'flex',
									gap: 8,
									marginBottom: 6,
									paddingBottom: 6,
									borderBottom: '1px solid #444'
								}}
							>
								{streaming && idx === messages.length - 1 ? (
									<svg
										width='18'
										height='18'
										viewBox='0 0 24 24'
										fill='#ff6b6b'
										style={{ cursor: 'pointer' }}
										onClick={handleStop}
									>
										<title>停止生成</title>
										<rect x='5' y='5' width='14' height='14' rx='2' />
									</svg>
								) : (
									<>
										<svg
											width='16'
											height='16'
											viewBox='0 0 24 24'
											fill='none'
											stroke='#1677ff'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'
											style={{ cursor: 'pointer' }}
											onClick={() => handleInsert(msg.content)}
										>
											<title>插入到编辑器</title>
											<path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z' />
											<polyline points='17 21 17 13 7 13 7 21' />
											<polyline points='7 3 7 8 15 8' />
										</svg>
										<svg
											width='16'
											height='16'
											viewBox='0 0 24 24'
											fill='none'
											stroke='#aaa'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'
											style={{ cursor: 'pointer' }}
											onClick={() => handleCopy(msg.content)}
										>
											<title>复制</title>
											<rect x='9' y='9' width='13' height='13' rx='2' />
											<path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
										</svg>
									</>
								)}
							</div>
						)}
						{msg.role === 'assistant' && streaming && idx === messages.length - 1 && !msg.content ? (
							<div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
								<span
									style={{
										display: 'inline-block',
										width: 16,
										height: 16,
										border: '2px solid #444',
										borderTopColor: '#4fc3f7',
										borderRadius: '50%',
										animation: 'ai-spin 0.8s linear infinite'
									}}
								/>
								<span style={{ color: '#888', fontSize: 13 }}>代码生成中...</span>
							</div>
						) : msg.role === 'assistant' ? (
							// 助手回复：说明文字 + 代码编辑器框分区渲染
							<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
								{parts.map((p, i) =>
									p.type === 'code' ? (
										<CodeBlock
											key={i}
											lang={p.lang}
											code={p.value}
											onCopy={() => copyRaw(p.value)}
											onInsert={() => insertRaw(p.value)}
										/>
									) : (
										<pre
											key={i}
											style={{
												margin: 0,
												whiteSpace: 'pre-wrap',
												wordBreak: 'break-word',
												fontFamily: 'inherit'
											}}
										>
											{p.value}
										</pre>
									)
								)}
							</div>
						) : (
							<pre
								style={{
									margin: 0,
									whiteSpace: 'pre-wrap',
									wordBreak: 'break-word',
									fontFamily: 'inherit'
								}}
							>
								{msg.content}
							</pre>
						)}
					</div>
					)
				})}
			</div>

			{/* 输入区 */}
			<div style={{ padding: 12, borderTop: '1px solid #333', flexShrink: 0 }}>
				<div style={{ position: 'relative' }}>
					<TextArea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder='输入你的需求...（Enter 发送，Shift+Enter 换行）'
						disabled={streaming}
						autoSize={{ minRows: 2, maxRows: 6 }}
						style={{
							background: '#2a2a2a',
							color: '#e6e6e6',
							border: '1px solid #444',
							borderRadius: 8,
							resize: 'none',
							paddingRight: 44
						}}
					/>
					<div
						style={{
							position: 'absolute',
							right: 8,
							bottom: 8,
							cursor: streaming ? 'not-allowed' : 'pointer',
							width: 38,
							height: 38,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: '50%',
							background: streaming ? 'transparent' : 'rgba(22,119,255,0.15)'
						}}
						onClick={() => !streaming && handleSend()}
					>
						<svg
							width='22'
							height='22'
							viewBox='0 0 24 24'
							fill='none'
							stroke={streaming ? '#666' : '#1677ff'}
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
						>
							<line x1='22' y1='2' x2='11' y2='13' />
							<polygon points='22 2 15 22 11 13 2 9 22 2' />
						</svg>
					</div>
				</div>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginTop: 8,
						fontSize: 12,
						color: '#888'
					}}
				>
					<label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
						<input
							type='checkbox'
							checked={injectCode}
							onChange={(e) => setInjectCode(e.target.checked)}
						/>
						注入当前编辑器代码
					</label>
					<span>Enter 发送</span>
				</div>
			</div>

			{/* 配置弹窗 */}
			<Modal
				title='模型配置'
				open={configOpen}
				onOk={handleSaveConfig}
				onCancel={() => setConfigOpen(false)}
				okText='保存'
				cancelText='取消'
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
					<div>
						<div style={{ marginBottom: 4, color: '#333' }}>Base URL</div>
						<Input
							value={config.baseUrl}
							onChange={(e) => setConfig((c) => ({ ...c, baseUrl: e.target.value }))}
							placeholder='https://api.deepseek.com'
						/>
						<div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>不要加反引号或空格，如 https://api.deepseek.com</div>
					</div>
					<div>
						<div style={{ marginBottom: 4, color: '#333' }}>Model</div>
						<Input
							value={config.model}
							onChange={(e) => setConfig((c) => ({ ...c, model: e.target.value }))}
							placeholder='deepseek-chat'
						/>
						<div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>DeepSeek 可用：deepseek-chat / deepseek-reasoner</div>
					</div>
					<div>
						<div style={{ marginBottom: 4, color: '#333' }}>API Key</div>
						<Input.Password
							value={config.key}
							onChange={(e) => setConfig((c) => ({ ...c, key: e.target.value }))}
							placeholder='sk-...'
						/>
					</div>
					<div style={{ fontSize: 12, color: '#e6a23c' }}>
						如果之前配置错误导致无响应，请点「保存」覆盖旧配置后重试。
					</div>
				</div>
			</Modal>
		</div>
		</>
	)
}

export default AiPanel
