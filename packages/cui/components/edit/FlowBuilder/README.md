# FlowBuilder 可视化流程编辑器组件

内置的可视化流程编排低代码组件，通过 `.form.yao` 中的 `edit.type = "FlowBuilder"` 声明使用。渲染包含「左侧节点面板 + 画布（nodes/edges）+ 右侧属性设置面板」的完整流程编辑器，支持单/多流程 Tab（可新增/删除命名流程）、全屏模式、滚动吸附、从服务端异步加载节点类型和设置配置（`setting`），以及可选的执行配置面板、流程预设 `presets`。输出结构为 `FlowValue[]`（或单流程），包含每个流程的 `flow` 元信息、`nodes`、`edges`、`execute` 执行配置，方便后端直接解析并驱动引擎执行。

---

## 一、快速开始

在任意 `.form.yao` 的 `fields.form` 对象中添加一个字段，并在 `layout.form.sections[*].columns` 中声明即可：

```json
{
  "fields": {
    "form": {
      "审批流程": {
        "bind": "flow_data",
        "edit": {
          "type": "FlowBuilder",
          "props": {
            "setting": { "api": "/api/flows/workflow_setting", "params": {} },
            "execute": { "api": "/api/flows/execute_options" },
            "presets": { "api": "/api/flows/presets" },
            "multiple": false,
            "height": 560,
            "removeAttribution": false
          }
        }
      }
    }
  },
  "layout": {
    "form": {
      "sections": [
        {
          "title": "流程配置",
          "columns": [
            { "name": "审批流程", "width": 24 }
          ]
        }
      ]
    }
  }
}
```

渲染效果：加载 `setting` 时显示骨架屏；加载完成后，左侧为节点类型列表（按 types 配置渲染），中间为画布可拖入连线，选择节点/边时右侧滑出对应属性面板（form/edge/execute 三类 section）。单流程模式隐藏顶部 Tabs；若 `multiple=true` 顶部为可增删的 Tab 栏（每个 Tab 一条独立流程，至少保留一条）。编辑后输出 FlowValue[] 到 `bind: flow_data`。

> 低代码加载机制参考 [database.form.yao](file:///home/project/yaoapps/lowcode/forms/sys/database.form.yao)。组件通过 `edit.type = "FlowBuilder"` 映射到 [FlowBuilder/index.tsx](file:///home/project/yaocodes/cui-v1.0/packages/cui/components/edit/FlowBuilder/index.tsx)。

---

## 二、Props 配置表

所有配置放在 `fields.form.<字段名>.edit.props` 下。

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `setting` | `Component.Request`（`{ api, params? }`） | — | **必填**。获取编辑器配置的请求；返回结构需为 `Setting`（包含 `flow/execute/edge` 三类 PanelSection、`types` 节点类型定义、`fields` 字段组件映射、可选 `defaultValue`）。组件会在 global.loading 结束后调用 utils.GetSetting 获取 |
| `execute` | `Component.Request` | — | 执行配置面板的额外请求（可选）；若 setting 已含 execute 可不用 |
| `presets` | `Component.Request` | — | 流程预设库的请求；返回 `PresetsResult`（直接 PresetItem[] 或带分类的 `{categories, presets}`），用于用户一键套用模板 |
| `value` | `FlowValue \| FlowValue[]` | — | 已保存的流程数据；单/多流程都可，内部用 `GetValues()` 归一化为数组。若没有 value 且 setting 返回了 defaultValue，则使用 defaultValue |
| `onChange` | `(data: FlowValue[]) => void` | — | 任一流（nodes/edges/flow/execute）变动都会同步到 data 数组并回调该函数；最终写回 bind |
| `multiple` | `boolean` | `false` | 是否「多流程 Tab」模式：<br>• `false` → 隐藏 Tabs，一个字段只维护一条 FlowValue<br>• `true` → Tabs 可新增/删除流程（至少保留 1 条，全删会弹错误提示「至少保留一个流程」） |
| `height` | `number` | `300`（不小于 300） | 画布区域最小高度；全屏时自动取 `window.innerHeight - 38 / - 80` |
| `disabled` | `boolean` | `false` | 是否禁用（readonly 查看态，具体需由子 Tab/画布配合） |
| `removeAttribution` | `boolean` | `false` | 是否移除画布水印/署名；透传给 Tab 构造器（需要画布实现识别该开关） |
| `label / bind / namespace / type` | - | 组件从 `__name / __bind / __namespace / __type` 自动注入 | 内部主要用 `__namespace` + `__bind` 构造多 Tab 时的默认 key，避免跨字段冲突 |
| `style` | `CSSProperties` | — | 行内样式 |
| `className` | `string` | — | 自定义 class |
| `itemProps` | `{ label, rules, ... }` | — | 外层 Form.Item 配置（label 必填等） |

### 核心数据结构（来自 types.ts）

```ts
type FlowValue = {
  id?: string
  flow?: { name, label, icon, closable, ... }      // 流程元信息（Tab 显示名、图标等）
  nodes?: FlowNode[]                                 // 节点（id/position/type/props）
  edges?: FlowEdge[]                                 // 连线（source/target/data）
  execute?: { input?, query?, ... }                  // 执行配置（运行时的输入/查询）
  data?: any
}

type Setting = {
  flow?: PanelSection[]       // 选中空白区域时的流程属性面板
  execute?: PanelSection[]    // 「执行配置」Tab 的表单 sections
  edge?: PanelSection[]       // 选中连线时的属性面板
  types?: PanelType[]         // 左侧可拖入节点类型（图标/分组/组件定义）
  fields?: Record<string, PanelColumnComponent> // 类型对应的编辑组件映射
  defaultValue?: FlowValue | FlowValue[]         // 初始空流程
}
```

### 交互细节

1. **初始化**：等待 props.setting 返回 → 若 value 为空则用 `GetValues(setting.defaultValue)` → 构造 Tab 列表（至少 1 条，不够自动补一个 `<未命名-1>`/`<Untitled-1>`）。
2. **数据双向**：Tab 内部画布的 `onData(id, 'nodes'|'edges'|'flow'|'execute', value)` 回写到对应 index 的 FlowValue，整个 data 数组变化后 `useEffect(() => props.onChange?.(data))` 冒泡给父表单。
3. **布局自适应**：`offsetTop=80`，滚动时如果顶部触达导航，会把「侧栏/画布/右侧面板」切为 fixed 固定定位；ResizeObserver 根据侧栏是否展开（200px）、右侧属性面板是否显示（460px）动态修正画布可用宽度。
4. **全屏**：fullscreen=true 时把根 div 切换为 `position:fixed; inset:0; zIndex:1000`，画布占满视口；高度自动 `innerHeight - (multiple?80:38)`。

---

## 三、用法示例

### 1. 单流程审批流（必填）

```jsonc
{
  "fields": {
    "form": {
      "审批流程": {
        "bind": "approval_flow",
        "edit": {
          "type": "FlowBuilder",
          "props": {
            "setting": { "api": "/api/flows/approval_setting" },
            "multiple": false,
            "height": 640,
            "itemProps": {
              "label": "审批流程",
              "rules": [
                { "required": true, "message": "请配置审批流程" }
              ]
            }
          }
        }
      }
    }
  }
}
```

### 2. 多流程工作流（可切换多套方案）

```jsonc
{
  "fields": {
    "form": {
      "工作流方案": {
        "bind": "workflows",
        "edit": {
          "type": "FlowBuilder",
          "props": {
            "setting": { "api": "/api/flows/workflow_setting", "params": { "biz": "leave" } },
            "presets": { "api": "/api/flows/workflow_presets", "params": { "biz": "leave" } },
            "multiple": true,
            "height": 720
          }
        }
      }
    }
  }
}
```

### 3. 查看页只读（简化版）

```jsonc
{
  "fields": {
    "form": {
      "当前流程": {
        "bind": "active_flow",
        "edit": {
          "type": "FlowBuilder",
          "props": {
            "setting": { "api": "/api/flows/view_setting" },
            "multiple": false,
            "height": 480,
            "disabled": true,
            "removeAttribution": true
          }
        }
      }
    }
  }
}
```

---

## 四、相关文件

| 文件 | 说明 |
|---|---|
| [index.tsx](file:///home/project/yaocodes/cui-v1.0/packages/cui/components/edit/FlowBuilder/index.tsx) | 组件实现（多 Tab 管理、初始化 setting、fullscreen/固定布局、onData 数据流） |
| [types.ts](file:///home/project/yaocodes/cui-v1.0/packages/cui/components/edit/FlowBuilder/types.ts) | 类型定义（Setting/FlowValue/FlowNode/FlowEdge/Preset/Category/FlowTab 等） |
| [utils.ts](file:///home/project/yaocodes/cui-v1.0/packages/cui/components/edit/FlowBuilder/utils.ts) | `GetSetting` / `GetValues` / `IconName` 等工具函数 |
| [components/](file:///home/project/yaocodes/cui-v1.0/packages/cui/components/edit/FlowBuilder/components) | 子组件：`Tab`（单流程画布容器，内部分发侧栏/画布/设置面板） |
| [index.less](file:///home/project/yaocodes/cui-v1.0/packages/cui/components/edit/FlowBuilder/index.less) | 组件样式（`_local` 容器、`_fullscreen` 全屏态等） |
| [database.form.yao](file:///home/project/yaoapps/lowcode/forms/sys/database.form.yao) | 低代码配置格式参考 |
