# Table 表格组件

基于 antd `<Table />` 封装的数据表格组件，配置由后端接口下发（`GET /${api_prefix}/table/${model}/setting`），内置查询、分页、行内编辑、行删除、批量选择与批量操作能力。

## 一、组件 Props

```ts
interface IProps {
  parent: 'Page' | 'Modal' | 'Form' | 'Dashboard' | 'Custom'
  model: string                 // 表格模型名，用于拉取配置与调用服务
  query?: Record<string, any>   // 初始查询参数
  data?: Array<any>             // parent === 'Custom' 时直接使用的外部数据
  namespace?: string            // 自定义命名空间，不传则根据 parent/model 自动生成
  hidePagination?: boolean      // 是否隐藏分页
  onChangeEventName?: string    // 行内保存成功后额外触发的事件名
}
```

### parent 取值说明

| parent     | 说明 |
| ---------- | ---- |
| `Page`     | 独立页面表格，自带 Page 容器、筛选区、批量操作入口 |
| `Modal`    | 弹窗内表格 |
| `Form`     | 表单内嵌表格（如主子表） |
| `Dashboard`| 仪表盘内表格 |
| `Custom`   | 自定义数据源，直接使用 `data`，不调用 search 接口 |

## 二、配置结构

表格配置来自后端 `table/${model}/setting`，核心结构如下（对应 [types/table.ts](../types/table.ts) 的 `TableType.Setting`）：

```json
{
  "name": "用户列表",
  "primary": "id",
  "header": {
    "preset": {
      "batch": {
        "columns": [
          { "name": "状态", "width": 8 }
        ],
        "deletable": true
      }
    }
  },
  "filter": {
    "columns": [
      { "name": "搜索", "width": 4 }
    ],
    "actions": []
  },
  "table": {
    "props": {
      "hidePagination": false,
      "customStyle": "compact",
      "withTotalRow": false,
      "scroll": { "x": 1200 }
    },
    "columns": [
      { "name": "姓名", "bind": "name", "view": { "bind": "name", "type": "Text" } }
    ],
    "operation": {
      "width": 160,
      "fold": false,
      "hide": false,
      "actions": []
    }
  },
  "fields": {
    "filter": {},
    "table": {}
  },
  "config": {
    "full": true
  }
}
```

### 字段说明

- `primary`：主键字段名，行操作与批量操作都基于它取值、传参。
- `table.props`：透传给 antd `<Table />` 的 props，同时支持扩展项：
  - `hidePagination`：隐藏分页（`props.hidePagination === true` 或组件 `hidePagination` prop 为真时生效）。
  - `customStyle: 'compact'`：紧凑样式。
  - `withTotalRow`：显示合计行。
- `table.columns` + `fields.table`：列定义与字段渲染配置，`columns[].bind` 绑定数据字段，`view` 定义单元格渲染。
- `filter.columns` + `fields.filter`：筛选区字段。
- `table.operation`：行操作列配置。

## 三、命名空间与事件

表格初始化后会在 `window.$app.Event` 上注册一组事件，key 统一为 `${namespace.value}/xxx`：

| 事件                        | 触发方法      | 说明 |
| --------------------------- | ------------- | ---- |
| `${namespace}/search`       | `search`      | 重新查询 / 带上指定查询参数 |
| `${namespace}/save`         | `save`        | 行内保存 |
| `${namespace}/delete`       | `delete`      | 删除单行（参数为主键值） |
| `${namespace}/refetch`      | `refetch`     | 重新拉取配置并查询 |
| `${namespace}/batchDelete`  | `batchDelete` | 批量删除（使用 `batch.selected`） |
| `${namespace}/batchUpdate`  | `batchUpdate` | 批量更新（使用 `batch.selected` + 参数） |

> **注意**：`namespace.value` 是完整路径（多条路径以 `/` 连接）。自动生成时：
> - `parent === 'Page'` / `'Modal'`：`Table-${parent}-${model}`；
> - `parent === 'Form'` / `'Dashboard'`：会**追加到父级堆栈之后**（例如页面内表单里的表格，其 namespace 前面会带上父表单路径，即 `${formNamespace}/Table-Form-${model}`）。
>
> 因此通过 `Common.emitEvent` 手动触发表格事件时，key 必须使用**完整 namespace**，不能只写叶子路径 `Table-Form-xxx`。

## 四、批量选择

### 1. 启用配置

在配置中声明 `header.preset.batch` 即可启用批量选择（**仅在 `parent === 'Page'` 时渲染批量入口按钮**）：

```json
{
  "header": {
    "preset": {
      "batch": {
        "columns": [
          { "name": "状态", "width": 8 },
          { "name": "标签", "width": 8 }
        ],
        "deletable": true
      }
    }
  }
}
```

- `columns`：批量编辑弹窗中可选的字段（复用 `fields.table` 中的 edit 定义）。
- `deletable`：是否显示「批量删除」按钮。

### 2. 交互流程

1. 点击自定义操作区的「批量编辑」图标 → `batch.active = true`。
2. 表格出现 checkbox 选择列，勾选的行主键值存入 `batch.selected`（`Array<number>`）。
3. 再次点击「选择并编辑」→ 弹出批量编辑弹窗，选字段、填值后确认 → 触发 `${namespace}/batchUpdate`。
4. 弹窗左下角「批量删除」（`deletable: true` 时显示）→ 确认后触发 `${namespace}/batchDelete`。

## 五、批量操作（通过 action 控件）

### 1. 内置批量操作

启用 `header.preset.batch` 后即自带「批量编辑」「批量删除」两个入口，无需额外配置，内部直接：
- 批量删除：`window.$app.Event.emit('${namespace}/batchDelete')`
- 批量更新：`window.$app.Event.emit('${namespace}/batchUpdate', 修改的字段值)`

### 2. 自定义批量操作 action

框架未提供 `Table.batchDelete` / `Table.batchUpdate` 的 action 类型，需要用 `Common.emitEvent` 手动发送对应事件。例如在 `filter.actions` 或其它 action 控件中加一个「批量删除」按钮：

```json
{
  "title": "批量删除",
  "icon": "icon-trash-2",
  "style": "danger",
  "action": [
    {
      "name": "confirmBatchDelete",
      "type": "Common.confirm",
      "payload": {
        "title": "警告",
        "content": "删除后不可恢复，请谨慎操作"
      }
    },
    {
      "name": "batchDelete",
      "type": "Common.emitEvent",
      "payload": {
        "key": "Table-Page-users/batchDelete"
      }
    }
  ]
}
```

批量更新同理，`emitEvent` 的 payload 传 key + value：

```json
{
  "name": "batchUpdate",
  "type": "Common.emitEvent",
  "payload": {
    "key": "Table-Page-users/batchUpdate",
    "value": { "status": "enabled" }
  }
}
```

> 上面 key 中的 `Table-Page-users` 是 `parent === 'Page'`、`model === 'users'` 时自动生成的 namespace，请按实际完整 namespace 替换。

## 六、常见行操作 action

`table.operation.actions` 中的每个 action 结构为 `{ title, icon, action, style?, disabled?, ... }`，`action` 是任务队列（数组）：

```json
{
  "table": {
    "operation": {
      "actions": [
        {
          "title": "编辑",
          "icon": "icon-edit-2",
          "action": [
            {
              "name": "edit",
              "type": "Common.openModal",
              "payload": {
                "Form": { "type": "edit", "model": "users", "id": "{{id}}" }
              }
            }
          ]
        },
        {
          "title": "删除",
          "icon": "icon-trash-2",
          "style": "danger",
          "action": [
            {
              "name": "confirm",
              "type": "Common.confirm",
              "payload": { "title": "警告", "content": "删除后不可恢复，请谨慎操作" }
            },
            {
              "name": "delete",
              "type": "Table.delete",
              "payload": {}
            }
          ]
        }
      ]
    }
  }
}
```

action 中可用的表格相关类型：

| 类型              | payload          | 行为 |
| ----------------- | ---------------- | ---- |
| `Table.search`    | `{}`             | 触发重新查询 |
| `Table.save`      | 要保存的字段对象 | 行内保存 |
| `Table.delete`    | `{}`             | 删除当前行（自动取 `data_item[primary]`） |
| `Common.refetch`  | `{}`             | 重新拉取配置并查询 |
| `Common.emitEvent`| `{ key, value }` | 发送任意事件（用于批量操作等） |

payload 中支持 `{{字段}}` Mustache 模板，运行时会被替换为当前行的字段值（如 `{{id}}`、`{{uuid}}`）。

## 七、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/base/Table/index.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/base/Table/model.ts
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/base/Table/types.ts
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/base/Table/services.ts
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/base/PureTable/index.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/optional/Table/Batch/index.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/actions/utils/handleActions.ts
- file:///home/project/yaocodes/cui-v1.0/packages/cui/types/table.ts