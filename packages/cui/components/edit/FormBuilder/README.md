# FormBuilder 可视化表单设计器组件

内置的可视化表单设计（低代码搭建）低代码组件，通过 `.form.yao` 中的 `edit.type = "FormBuilder"` 声明使用。渲染包含「左侧字段类型侧栏（Sidebar）+ 中间拖拽画布（Canvas 基于 react-grid-layout）+ 右侧字段属性面板」的完整表单搭建器。支持全屏、滚动吸附固定、从服务端异步拉取字段类型配置（setting.types / default 数据模板），输出结构为 `Data = { columns, form }`，其中 `columns` 是字段列表（含 x/y/width/type/props 用于 grid 布局），`form` 是画布的公共配置，可直接作为生成目标 `.form.yao` / 动态表单的数据模型。

---

## 一、快速开始

在任意 `.form.yao` 的 `fields.form` 对象中添加一个字段，并在 `layout.form.sections[*].columns` 中声明即可：

```json
{
  "fields": {
    "form": {
      "表单设计": {
        "bind": "form_design",
        "edit": {
          "type": "FormBuilder",
          "props": {
            "setting": { "api": "/api/formbuilder/types", "params": {} },
            "presets": { "api": "/api/formbuilder/presets" },
            "height": 640,
            "panelWidth": 420
          }
        }
      }
    }
  },
  "layout": {
    "form": {
      "sections": [
        {
          "title": "自定义表单",
          "columns": [
            { "name": "表单设计", "width": 24 }
          ]
        }
      ]
    }
  }
}
```

渲染效果：加载 setting 时显示骨架屏；完成后左侧为可拖拽字段列表（Text/Number/Select/Upload 等类型，types 里配置），中间是网格画布（react-grid-layout），字段可拖入、拖排、调整宽度；点击字段时右侧 420px 属性面板弹出，编辑其 props/label/校验；可全屏。最终通过 `onChange(data)` 输出 `{ columns, form }` 到 `bind: form_design`。

> 低代码加载机制参考 [database.form.yao](file:///home/project/yaoapps/lowcode/forms/sys/database.form.yao)。组件通过 `edit.type = "FormBuilder"` 映射到 [FormBuilder/index.tsx](file:///home/project/yaocodes/cui-v1.0/packages/cui/components/edit/FormBuilder/index.tsx)。

---

## 二、Props 配置表

所有配置放在 `fields.form.<字段名>.edit.props` 下。

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `setting` | `Component.Request`（`{ api, params? }`） | — | **必填**。拉取设计器配置：返回 `Setting = { types, fields, form?, defaultValue? }`。包含 types（左侧可用字段类型定义）、fields（各类型属性面板使用的组件映射）、form（画布全局配置表单 sections，可选）、defaultValue（首次空白模板，可选）。utils.GetSetting 解析 |
| `presets` | `Component.Request` | — | 表单预设库请求，返回 Presets（预设字段模板数组），用户可一键把预设拖入/插入画布 |
| `value` | `Data = { columns, form? }` | — | 已保存的表单设计；若存在则同步到内部 state，作为初始画布内容 |
| `onChange` | `(data: Data) => void` | — | 当画布字段增删/位置/属性变化时，输出最新的 `{columns, form}`。内部由 Canvas `onCanvasChange(value, height)` 回传 → 更新 contentHeight 并触发该回调 → 父表单写入 bind |
| `height` | `number` | `300`（不小于 300） | 设计器最小高度。全屏时改为 `window.innerHeight - 64` |
| `panelWidth` | `number` | `420` | 右侧属性面板宽度（px），用于计算中间画布可用宽度（`offsetWidth += panelWidth`） |
| `disabled` | `boolean` | `false` | 是否禁用（只读查看）；具体禁用逻辑由 Sidebar/Canvas 内部落实 |
| `label / bind / type` | - | 组件从 `__name / __bind / __type` 注入 | 主要用于 Canvas/面板里的 namespace/bind 等上下文传递，避免命名冲突 |
| `style` | `CSSProperties` | — | 行内样式 |
| `className` | `string` | — | 自定义 class |
| `itemProps` | `{ label, rules, ... }` | — | 外层 Form.Item 配置（整体必填/标签等） |

### 输出 Data 结构（来自 types.ts）

```ts
type Data = {
  columns: Field[]                 // 画布中的字段（每个字段一个 GridLayout item）
  form?: Record<string, any>       // 画布全局表单配置（如 labelCol / wrapperCol / 布局模式等）
}

type Field = {
  id?: string
  type: string                      // 组件类型，如 Input/Select/Upload
  width?: number                    // 栅格宽度（24 栅格）
  resizable?: boolean               // 是否允许拖拽调宽（默认 true）
  x?: number; y?: number            // GridLayout 位置（行/列）
  props?: Record<string, any>       // 该字段的 edit.props 配置（placeholder/required/defaultValue 等）
}
```

### Setting 结构

```ts
type Setting = {
  defaultValue?: Data             // 首次打开时的默认模板
  form?: PanelSection[]           // 画布全局配置（sections 数组，渲染为右侧"表单配置"Tab）
  types?: PanelType[]             // 左侧可拖入的字段类型列表
  fields?: Record<string, PanelColumnComponent> // 选中字段时属性面板使用的组件映射
}
```

### 交互细节

1. **初始化顺序**：等待 global.loading 结束 → 调用 props.setting → 获取到 setting 后渲染 Sidebar/Canvas；若 props.value 存在，用其初始化画布内容。
2. **布局自适应**：`offsetTop=80`，页面滚动时若顶部靠近导航（top ≤ offsetTop 且组件底部仍在视野内），切为 fixed 定位把侧栏、画布固定住；ResizeObserver 负责：
   - 侧栏展开（200px）+ 面板可见（panelWidth，默认 420）→ 扣除后剩余宽度给 Canvas
   - 根容器大小变化时重新分配
3. **全屏模式**：`fullscreen` 开关由 Canvas 暴露；打开后根 div `position:fixed inset:0 overflow-y:hidden zIndex:1000`，高度改为 `window.innerHeight - 64`。
4. **高度回传**：Canvas 在内容改变时会把实际占用的 contentHeight 回传，方便父级滚动。

---

## 三、用法示例

### 1. 基础表单设计器（必填 + 最小高度 600）

```jsonc
{
  "fields": {
    "form": {
      "报名表设计": {
        "bind": "signup_form",
        "edit": {
          "type": "FormBuilder",
          "props": {
            "setting": { "api": "/api/formbuilder/setting", "params": { "scene": "signup" } },
            "height": 600,
            "itemProps": {
              "label": "报名表设计",
              "rules": [
                { "required": true, "message": "请至少设计一个字段" }
              ]
            }
          }
        }
      }
    }
  }
}
```

### 2. 带预设库 + 更宽属性面板

```jsonc
{
  "fields": {
    "form": {
      "调查问卷": {
        "bind": "survey_form",
        "edit": {
          "type": "FormBuilder",
          "props": {
            "setting": { "api": "/api/formbuilder/survey_setting" },
            "presets": { "api": "/api/formbuilder/survey_presets" },
            "height": 720,
            "panelWidth": 480
          }
        }
      }
    }
  }
}
```

### 3. 只读查看（已有设计稿展示）

```jsonc
{
  "fields": {
    "form": {
      "当前设计稿": {
        "bind": "published_form",
        "edit": {
          "type": "FormBuilder",
          "props": {
            "setting": { "api": "/api/formbuilder/view_setting" },
            "height": 480,
            "disabled": true
          }
        }
      }
    }
  }
}
```

### 4. 把 edit/ 目录下所有 30 个组件都纳入设计器（Setting.types 示例）

下面是一份**完整的后端 setting 接口返回值模板**：把 `components/edit/` 下全部 30 个组件注册为左侧字段类型，同时把常用属性面板（placeholder/必填校验/options/count/defaultValue/allowHalf 等）填到每种 type 的 `props.sections` 里，用户把左侧某个组件拖入画布后，点选字段即可在右侧属性面板可视化编辑其配置。

```typescript
// 后端 setting 接口返回示例:完整 Setting 对象
const FULL_FORM_BUILDER_SETTING: Setting = {

  // ====== (1) 可选:画布的全局表单配置(渲染为右侧"表单配置"Tab) ======
  form: [
    {
      title: "基础设置",
      columns: [
        { name: "布局方式", component: { bind: "layout", edit: { type: "Select", props: { options: [
          { label: "栅格(Grid)", value: "grid" }, { label: "流式(Flow)", value: "flow" }
        ], defaultValue: "grid" } } } },
        { name: "labelCol", component: { bind: "labelCol", edit: { type: "InputNumber", props: { min: 2, max: 24, defaultValue: 6 } } } },
        { name: "wrapperCol", component: { bind: "wrapperCol", edit: { type: "InputNumber", props: { min: 2, max: 24, defaultValue: 16 } } } },
      ]
    }
  ],

  // ====== (2) 必填:左侧字段类型(把 edit/* 全部 30 个组件加进去) ======
  types: [
    // —————————————— 输入类 ——————————————
    { name: "Input",         label: "单行文本",    icon: { name: "icon-edit",  size: 16 }, width: 12, resizable: true,
      props: [{ title: "基础", columns: [
        { name: "占位文字", component: { bind: "props.placeholder", edit: { type: "Input", props: { placeholder: "请输入" } } } },
        { name: "默认值",   component: { bind: "props.defaultValue", edit: { type: "Input", props: {} } } },
        { name: "最大长度", component: { bind: "props.maxLength", edit: { type: "InputNumber", props: { min: 0 } } } },
        { name: "禁用",     component: { bind: "props.disabled", edit: { type: "RadioGroup", props: { style: { type: "Boolean" }, options: [{label:"是",value:true},{label:"否",value:false}], defaultValue:false } } } }
      ] }] },
    { name: "TextArea",      label: "多行文本",    icon: { name: "icon-menu",  size: 16 }, width: 24,
      props: [{ title: "基础", columns: [
        { name: "占位文字", component: { bind: "props.placeholder", edit: { type: "Input", props: { placeholder: "请输入" } } } },
        { name: "行数",     component: { bind: "props.rows", edit: { type: "InputNumber", props: { min: 1, defaultValue: 4 } } } },
        { name: "最大长度", component: { bind: "props.maxLength", edit: { type: "InputNumber", props: { min: 0 } } } }
      ] }] },
    { name: "InputNumber",   label: "数字输入",    icon: { name: "icon-hash",  size: 16 }, width: 12,
      props: [{ title: "基础", columns: [
        { name: "最小值", component: { bind: "props.min", edit: { type: "InputNumber", props: {} } } },
        { name: "最大值", component: { bind: "props.max", edit: { type: "InputNumber", props: {} } } },
        { name: "步长",   component: { bind: "props.step", edit: { type: "InputNumber", props: { min: 0, step: 0.01, defaultValue: 1 } } } },
        { name: "精度",   component: { bind: "props.precision", edit: { type: "InputNumber", props: { min: 0, max: 10 } } } },
        { name: "千分位", component: { bind: "props.formatterStyle", edit: { type: "RadioGroup", props: { style: { type: "Boolean" }, options:[{label:"启用",value:true},{label:"关闭",value:false}], defaultValue:false } } } }
      ] }] },
    { name: "Password",      label: "密码输入",    icon: { name: "icon-lock",  size: 16 }, width: 12,
      props: [{ title: "基础", columns: [
        { name: "占位文字", component: { bind: "props.placeholder", edit: { type: "Input", props: { placeholder: "请输入密码" } } } },
        { name: "显示强度", component: { bind: "props.strength", edit: { type: "RadioGroup", props: { style:{type:"Boolean"}, options:[{label:"是",value:true},{label:"否",value:false}], defaultValue:true } } } }
      ] }] },
    { name: "Mentions",      label: "@提及",       icon: { name: "icon-at",    size: 16 }, width: 24,
      props: [{ title: "基础", columns: [
        { name: "触发字符", component: { bind: "props.prefix", edit: { type: "Input", props: { defaultValue: "@", maxLength: 1 } } } },
        { name: "占位文字", component: { bind: "props.placeholder", edit: { type: "Input", props: {} } } }
      ] }] },

    // —————————————— 选择类 ——————————————
    { name: "Select",          label: "下拉选择",   icon: { name: "icon-arrowDown", size: 16 }, width: 12,
      props: [{ title: "选项", columns: [
        { name: "选项列表", component: { bind: "props.options", edit: { type: "List", props: { option: { name: "ListSelect", bind: "id", props: { columns: [
          { name: "文本", component: { bind: "label", edit: { type: "Input", props: { placeholder: "显示文本" } } } },
          { name: "值",   component: { bind: "value", edit: { type: "Input", props: { placeholder: "选项值" } } } }
        ] } } } } } }
      ] }] },
    { name: "AutoComplete",    label: "自动补全",   icon: { name: "icon-search", size: 16 }, width: 12,
      props: [{ title: "基础", columns: [
        { name: "占位文字", component: { bind: "props.placeholder", edit: { type: "Input", props: {} } } }
      ] }] },
    { name: "RadioGroup",      label: "单选按钮组", icon: { name: "icon-record", size: 16 }, width: 12,
      props: [{ title: "基础", columns: [
        { name: "样式", component: { bind: "props.style.type", edit: { type: "RadioGroup", props: { defaultValue: "radio", options: [
          { label: "默认 Radio", value: "radio" }, { label: "按钮模式", value: "button" }, { label: "布尔", value: "Boolean" }
        ] } } } },
        { name: "选项", component: { bind: "props.options", edit: { type: "List", props: { option: { name: "ListOption", bind: "id", props: { columns: [
          { name: "文本", component: { bind: "label", edit: { type: "Input", props: { placeholder: "选项文本" } } } },
          { name: "值",   component: { bind: "value", edit: { type: "Input", props: { placeholder: "选项值" } } } }
        ] } } } } } }
      ] }] },
    { name: "CheckboxGroup",   label: "多选复选框组", icon: { name: "icon-checkSquare", size: 16 }, width: 24,
      props: [{ title: "基础", columns: [
        { name: "选项", component: { bind: "props.options", edit: { type: "List", props: { option: { name: "ListOption", bind: "id", props: { columns: [
          { name: "文本", component: { bind: "label", edit: { type: "Input", props: { placeholder: "选项文本" } } } },
          { name: "值",   component: { bind: "value", edit: { type: "Input", props: { placeholder: "选项值" } } } }
        ] } } } } } }
      ] }] },
    { name: "Cascader",        label: "级联选择",   icon: { name: "icon-list",   size: 16 }, width: 12,
      props: [{ title: "基础", columns: [
        { name: "占位文字", component: { bind: "props.placeholder", edit: { type: "Input", props: {} } } }
      ] }] },
    { name: "Tree",            label: "树形选择",   icon: { name: "icon-tree",   size: 16 }, width: 12,
      props: [{ title: "基础", columns: [
        { name: "占位文字", component: { bind: "props.placeholder", edit: { type: "Input", props: {} } } },
        { name: "多选",     component: { bind: "props.multiple", edit: { type: "RadioGroup", props: { style:{type:"Boolean"}, options:[{label:"是",value:true},{label:"否",value:false}], defaultValue:false } } } }
      ] }] },

    // —————————————— 日期时间类 ——————————————
    { name: "DatePicker",      label: "日期",       icon: { name: "icon-calendar", size: 16 }, width: 12,
      props: [{ title: "基础", columns: [
        { name: "占位文字", component: { bind: "props.placeholder", edit: { type: "Input", props: { placeholder: "请选择日期" } } } },
        { name: "输出格式", component: { bind: "props.outputFormat", edit: { type: "Select", props: { defaultValue: "YYYY-MM-DD", options: [
          { label: "YYYY-MM-DD", value: "YYYY-MM-DD" }, { label: "YYYY/MM/DD", value: "YYYY/MM/DD" },
          { label: "YYYY-MM-DD HH:mm:ss", value: "YYYY-MM-DD HH:mm:ss" }
        ] } } } }
      ] }] },
    { name: "RangePicker",     label: "日期范围",   icon: { name: "icon-calendarTwo", size: 16 }, width: 24,
      props: [{ title: "基础", columns: [
        { name: "占位文字", component: { bind: "props.placeholder", edit: { type: "Mentions", props: { placeholder: "开始,结束" } } } },
        { name: "输出格式", component: { bind: "props.outputFormat", edit: { type: "Select", props: { defaultValue: "YYYY-MM-DD", options: [
          { label: "YYYY-MM-DD", value: "YYYY-MM-DD" }, { label: "YYYY-MM-DD HH:mm:ss", value: "YYYY-MM-DD HH:mm:ss" }
        ] } } } }
      ] }] },
    { name: "TimePicker",      label: "时间选择",   icon: { name: "icon-clock", size: 16 }, width: 12,
      props: [{ title: "基础", columns: [
        { name: "占位文字", component: { bind: "props.placeholder", edit: { type: "Input", props: {} } } },
        { name: "输出格式", component: { bind: "props.format", edit: { type: "Select", props: { defaultValue: "HH:mm:ss", options: [
          { label: "HH:mm:ss", value: "HH:mm:ss" }, { label: "HH:mm", value: "HH:mm" }
        ] } } } }
      ] }] },

    // —————————————— 评分/颜色/开关类 ——————————————
    { name: "Rate",            label: "星星评分",   icon: { name: "icon-star", size: 16 }, width: 12,
      props: [{ title: "基础", columns: [
        { name: "总分(星星数)", component: { bind: "props.count", edit: { type: "InputNumber", props: { min: 1, max: 10, defaultValue: 5 } } } },
        { name: "默认评分",     component: { bind: "props.defaultValue", edit: { type: "InputNumber", props: { min: 0, defaultValue: 0 } } } },
        { name: "允许半星",     component: { bind: "props.allowHalf", edit: { type: "RadioGroup", props: { style:{type:"Boolean"}, options:[{label:"是",value:true},{label:"否",value:false}], defaultValue:false } } } },
        { name: "允许清除",     component: { bind: "props.allowClear", edit: { type: "RadioGroup", props: { style:{type:"Boolean"}, options:[{label:"是",value:true},{label:"否",value:false}], defaultValue:true } } } },
        { name: "星星颜色",     component: { bind: "props.style.color", edit: { type: "ColorPicker", props: {} } } }
      ] }] },
    { name: "ColorPicker",     label: "颜色选择",   icon: { name: "icon-droplet", size: 16 }, width: 12,
      props: [{ title: "基础", columns: [
        { name: "默认值", component: { bind: "props.defaultValue", edit: { type: "ColorPicker", props: {} } } }
      ] }] },
    { name: "Switch",          label: "开关(在 ui/inputs/)", icon: { name: "icon-toggle", size: 16 }, width: 12,
      props: [{ title: "基础", columns: [
        { name: "默认值", component: { bind: "props.defaultValue", edit: { type: "RadioGroup", props: { style:{type:"Boolean"}, options:[{label:"开",value:true},{label:"关",value:false}], defaultValue:false } } } }
      ] }] },

    // —————————————— 上传/展示类 ——————————————
    { name: "Upload",          label: "文件上传",   icon: { name: "icon-upload", size: 16 }, width: 24,
      props: [{ title: "基础", columns: [
        { name: "接收类型", component: { bind: "props.accept", edit: { type: "Input", props: { placeholder: "image/*,application/pdf,..." } } } },
        { name: "最大数量", component: { bind: "props.multipleLimit", edit: { type: "InputNumber", props: { min: 1, defaultValue: 10 } } } },
        { name: "上传接口", component: { bind: "props.action", edit: { type: "Input", props: { placeholder: "/api/__yao/upload" } } } }
      ] }] },
    { name: "Image",           label: "图片展示(Upload 子能力)", icon: { name: "icon-image", size: 16 }, width: 12,
      props: [{ title: "基础", columns: [
        { name: "接收", component: { bind: "props.accept", edit: { type: "Input", props: { defaultValue: "image/*" } } } }
      ] }] },
    { name: "FileViewer",      label: "文件查看",   icon: { name: "icon-file", size: 16 }, width: 12,
      props: [{ title: "基础", columns: [
        { name: "占位文字", component: { bind: "props.placeholder", edit: { type: "Input", props: {} } } }
      ] }] },
    { name: "Text",            label: "纯文本展示", icon: { name: "icon-text", size: 16 }, width: 12,
      props: [{ title: "基础", columns: [
        { name: "文本内容", component: { bind: "props.defaultValue", edit: { type: "TextArea", props: { rows: 3 } } } }
      ] }] },

    // —————————————— 富文本/代码编辑器 ——————————————
    { name: "RichText",        label: "富文本编辑器", icon: { name: "icon-edit-2", size: 16 }, width: 24,
      props: [{ title: "基础", columns: [
        { name: "最小高度", component: { bind: "props.height", edit: { type: "InputNumber", props: { min: 120, defaultValue: 300 } } } }
      ] }] },
    { name: "WangEditor",      label: "WangEditor 富文本", icon: { name: "icon-feather", size: 16 }, width: 24,
      props: [{ title: "基础", columns: [
        { name: "最小高度", component: { bind: "props.height", edit: { type: "InputNumber", props: { min: 120, defaultValue: 300 } } } }
      ] }] },
    { name: "CodeEditor",      label: "代码编辑器", icon: { name: "icon-code", size: 16 }, width: 24,
      props: [{ title: "基础", columns: [
        { name: "语言", component: { bind: "props.language", edit: { type: "Select", props: { defaultValue: "javascript", options: [
          { label: "JavaScript", value: "javascript" }, { label: "TypeScript", value: "typescript" },
          { label: "JSON", value: "json" }, { label: "YAML", value: "yaml" }, { label: "HTML", value: "html" },
          { label: "CSS", value: "css" }, { label: "SQL", value: "sql" }
        ] } } } },
        { name: "主题", component: { bind: "props.theme", edit: { type: "RadioGroup", props: { defaultValue: "vs-dark", options: [
          { label: "深色 vs-dark", value: "vs-dark" }, { label: "浅色 vs-light", value: "vs-light" }
        ] } } } },
        { name: "高度", component: { bind: "props.height", edit: { type: "InputNumber", props: { min: 120, defaultValue: 400 } } } }
      ] }] },

    // —————————————— 编排/嵌入/流程 ——————————————
    { name: "Frame",           label: "iframe 嵌入", icon: { name: "icon-externalLink", size: 16 }, width: 24,
      props: [{ title: "基础", columns: [
        { name: "URL", component: { bind: "props.src", edit: { type: "Input", props: { placeholder: "https://..." } } } },
        { name: "高度", component: { bind: "props.height", edit: { type: "InputNumber", props: { min: 120, defaultValue: 480 } } } }
      ] }] },
    { name: "Gantt",           label: "甘特图",     icon: { name: "icon-ganttChart", size: 16 }, width: 24,
      props: [{ title: "基础", columns: [
        { name: "高度", component: { bind: "props.height", edit: { type: "InputNumber", props: { min: 200, defaultValue: 480 } } } }
      ] }] },
    { name: "FlowBuilder",     label: "流程设计器", icon: { name: "icon-workflow", size: 16 }, width: 24,
      props: [{ title: "基础", columns: [
        { name: "最小高度", component: { bind: "props.height", edit: { type: "InputNumber", props: { min: 300, defaultValue: 600 } } } }
      ] }] },
    { name: "FormBuilder",     label: "子表单设计器(嵌套)", icon: { name: "icon-layout", size: 16 }, width: 24,
      props: [{ title: "基础", columns: [
        { name: "最小高度", component: { bind: "props.height", edit: { type: "InputNumber", props: { min: 300, defaultValue: 480 } } } }
      ] }] },

    // —————————————— 布局/容器/分组 ——————————————
    { name: "Divider",         label: "分组/分割线", icon: { name: "icon-minus", size: 16 }, width: 24,
      props: [{ title: "基础", columns: [
        { name: "分组标题", component: { bind: "props.title", edit: { type: "Input", props: { placeholder: "分组名称" } } } }
      ] }] },
    { name: "Placement",       label: "字段容器/布局块", icon: { name: "icon-grid", size: 16 }, width: 24,
      props: [{ title: "基础", columns: [
        { name: "栅格列数", component: { bind: "props.cols", edit: { type: "InputNumber", props: { min: 1, max: 24, defaultValue: 2 } } } }
      ] }] },
    { name: "List",            label: "弹窗列表选择", icon: { name: "icon-listChecks", size: 16 }, width: 12,
      props: [{ title: "基础", columns: [
        { name: "弹窗标题", component: { bind: "props.title", edit: { type: "Input", props: { placeholder: "选择..." } } } },
        { name: "列表接口", component: { bind: "props.api",   edit: { type: "Input", props: { placeholder: "/api/xxx/list" } } } }
      ] }] },
    { name: "Table",           label: "表格(行编辑)", icon: { name: "icon-table", size: 16 }, width: 24,
      props: [{ title: "基础", columns: [
        { name: "最小行数", component: { bind: "props.minRows", edit: { type: "InputNumber", props: { min: 0, defaultValue: 1 } } } },
        { name: "可新增行", component: { bind: "props.creatable", edit: { type: "RadioGroup", props: { style:{type:"Boolean"}, options:[{label:"是",value:true},{label:"否",value:false}], defaultValue:true } } } }
      ] }] },
    { name: "Item",            label: "Form.Item 包装", icon: { name: "icon-panel", size: 16 }, width: 12,
      props: [{ title: "基础", columns: [
        { name: "必填", component: { bind: "props.required", edit: { type: "RadioGroup", props: { style:{type:"Boolean"}, options:[{label:"是",value:true},{label:"否",value:false}], defaultValue:false } } } }
      ] }] }
  ],

  // ====== (3) 可选:首次打开时的默认画布(= Data = { columns, form })——见"五、示例 Data" ======
  defaultValue: { form: {}, columns: [] }
}
```

> 使用说明:把上面 `FULL_FORM_BUILDER_SETTING` 作为后端接口的返回体,前端在 `.form.yao` 中声明 `"setting": { "api": "/api/你的接口路径" }` 即可把 30 个组件全部加载进设计器左侧栏。
>
> `Setting.types[i].props[*].columns[*].component.edit.type` 依然是用 `edit/*` 下的组件名(属性面板里编辑"选项列表"用 `List`、编辑"占位文字"用 `Input`、编辑"是否禁用"用 `RadioGroup` 的布尔模式等),形成自举:设计器内部画属性面板时仍然复用同一套 edit 组件。

---

## 五、示例 Data:把所有 edit/ 组件放进同一张画布(预置字段)

以下是 `Setting.defaultValue`(或 FormBuilder 的 `value`)可用的完整表单模板:画布中一次性把 **30 个 edit 组件**全部渲染出来,分 3 个分组,栅格宽度 24/12 交替。用户可以直接把它作为"新建表单"时的默认模板或预设。

```typescript
const ALL_EDIT_COMPONENTS_DATA: Data = {
  form: {
    layout: "grid",
    labelCol: 6,
    wrapperCol: 16
  },
  columns: [
    // 第一行:文本输入组(两个 12 宽一行)
    { id: "f1",  type: "Input",        width: 12, x: 0,  y: 0,
      props: { placeholder: "请输入姓名", itemProps: { label: "姓名" } } },
    { id: "f2",  type: "Password",     width: 12, x: 12, y: 0,
      props: { placeholder: "至少 8 位", strength: true, itemProps: { label: "密码" } } },
    { id: "f3",  type: "InputNumber",  width: 12, x: 0,  y: 1,
      props: { placeholder: "年龄", min: 0, max: 120, itemProps: { label: "年龄" } } },
    { id: "f4",  type: "TextArea",     width: 24, x: 0,  y: 2,
      props: { placeholder: "请输入个人简介", rows: 4, itemProps: { label: "简介" } } },
    { id: "f5",  type: "Mentions",     width: 24, x: 0,  y: 3,
      props: { placeholder: "输入 @ 以提及成员", itemProps: { label: "协作成员" } } },

    // 选择类
    { id: "f6",  type: "Select",       width: 12, x: 0,  y: 4,
      props: { placeholder: "请选择", options: [{label:"选项A",value:"a"},{label:"选项B",value:"b"}], itemProps: { label: "下拉" } } },
    { id: "f7",  type: "AutoComplete", width: 12, x: 12, y: 4,
      props: { placeholder: "搜索补全", itemProps: { label: "搜索" } } },
    { id: "f8",  type: "RadioGroup",   width: 12, x: 0,  y: 5,
      props: { style: { type: "button" }, options: [{label:"男",value:"M"},{label:"女",value:"F"},{label:"其他",value:"O"}], itemProps: { label: "性别" } } },
    { id: "f9",  type: "CheckboxGroup",width: 24, x: 0,  y: 6,
      props: { options: [{label:"阅读",value:"read"},{label:"运动",value:"sport"},{label:"音乐",value:"music"},{label:"代码",value:"code"}], itemProps: { label: "兴趣" } } },
    { id: "f10", type: "Cascader",     width: 12, x: 0,  y: 7,
      props: { placeholder: "省/市/区", itemProps: { label: "所在地区" } } },
    { id: "f11", type: "Tree",         width: 12, x: 12, y: 7,
      props: { placeholder: "选择部门", multiple: true, itemProps: { label: "所属部门" } } },

    // 日期时间
    { id: "f12", type: "DatePicker",   width: 12, x: 0,  y: 8,
      props: { outputFormat: "YYYY-MM-DD", itemProps: { label: "出生日期" } } },
    { id: "f13", type: "RangePicker",  width: 24, x: 0,  y: 9,
      props: { outputFormat: "YYYY-MM-DD", itemProps: { label: "在职时间" } } },
    { id: "f14", type: "TimePicker",   width: 12, x: 0,  y: 10,
      props: { format: "HH:mm", itemProps: { label: "提醒时间" } } },

    // 评分/颜色/开关
    { id: "f15", type: "Rate",         width: 12, x: 0,  y: 11,
      props: { count: 5, defaultValue: 3, allowHalf: true, style: { color: "#faad14" }, itemProps: { label: "满意度" } } },
    { id: "f16", type: "ColorPicker",  width: 12, x: 12, y: 11,
      props: { defaultValue: "#1677ff", itemProps: { label: "主题色" } } },

    // 上传/展示
    { id: "f17", type: "Upload",       width: 24, x: 0,  y: 12,
      props: { accept: "image/*,application/pdf", multipleLimit: 5, itemProps: { label: "附件" } } },
    { id: "f18", type: "Image",        width: 12, x: 0,  y: 13,
      props: { accept: "image/*", itemProps: { label: "头像" } } },
    { id: "f19", type: "FileViewer",   width: 12, x: 12, y: 13,
      props: { itemProps: { label: "合同预览" } } },
    { id: "f20", type: "Text",         width: 24, x: 0,  y: 14,
      props: { defaultValue: "提示:提交后不可修改", itemProps: { label: "说明" } } },

    // 富文本/代码
    { id: "f21", type: "RichText",     width: 24, x: 0,  y: 15,
      props: { height: 240, itemProps: { label: "正文" } } },
    { id: "f22", type: "WangEditor",   width: 24, x: 0,  y: 16,
      props: { height: 240, itemProps: { label: "介绍(WangEditor)" } } },
    { id: "f23", type: "CodeEditor",   width: 24, x: 0,  y: 17,
      props: { language: "json", theme: "vs-dark", height: 200, defaultValue: "{\n  \"hello\": \"world\"\n}", itemProps: { label: "JSON 配置" } } },

    // 编排/嵌入
    { id: "f24", type: "Frame",        width: 24, x: 0,  y: 18,
      props: { src: "https://example.com/embedded-doc", height: 320, itemProps: { label: "嵌入文档" } } },
    { id: "f25", type: "Gantt",        width: 24, x: 0,  y: 19,
      props: { height: 300, itemProps: { label: "排期甘特图" } } },
    { id: "f26", type: "FlowBuilder",  width: 24, x: 0,  y: 20,
      props: { height: 480, itemProps: { label: "审批流程" } } },

    // 布局/容器
    { id: "f27", type: "Divider",      width: 24, x: 0,  y: 21,
      props: { title: "— 分组:高级设置 —", itemProps: { label: "" } } },
    { id: "f28", type: "List",         width: 12, x: 0,  y: 22,
      props: { title: "选择负责人", api: "/api/user/list", itemProps: { label: "负责人" } } },
    { id: "f29", type: "Table",        width: 24, x: 0,  y: 23,
      props: { minRows: 2, creatable: true, itemProps: { label: "多行子表(行编辑)" } } },
    { id: "f30", type: "Item",         width: 24, x: 0,  y: 24,
      props: { required: true, itemProps: { label: "整体字段包装示例" } } }
  ]
}
```

---

## 六、如何在 Yao 后端对应接口里组合返回(最小可用)

把上面两段 JSON 放入同一个后端 handler(以 Yao 的 script/process 为例):

```js
// processes/app/formbuilder/setting.http.js
const FULL_SETTING = require('./full_setting.json').default; // 第四节的 Setting 对象
const DEFAULT_DATA  = require('./all_components_data.json').default; // 第五节的 Data 对象

// 挂载为: GET /api/formbuilder/setting?preload=all
function Handler(req) {
  const setting = JSON.parse(JSON.stringify(FULL_SETTING));
  if (req.query.preload === 'all') {
    // 打开设计器时,默认把全部 30 个组件预填到画布上,用户从这份模板改
    setting.defaultValue = DEFAULT_DATA;
  }
  return { code: 0, data: setting, message: "" };
}
```

前端对应 `.form.yao` 配置:

```jsonc
{
  "fields": {
    "form": {
      "低代码表单": {
        "bind": "form_schema",
        "edit": {
          "type": "FormBuilder",
          "props": {
            "setting": { "api": "/api/formbuilder/setting", "params": { "preload": "all" } },
            "height": 800,
            "panelWidth": 480,
            "itemProps": { "label": "表单设计" }
          }
        }
      }
    }
  }
}
```

用户打开页面即看到:左侧列出所有 30 个组件、右侧属性面板按每种组件的 `props.sections[].columns[]` 正确渲染、中间画布预填了第五节的 30 个字段模板,可直接拖拽/改属性/保存。

---

## 四、相关文件

| 文件 | 说明 |
|---|---|
| [index.tsx](file:///home/project/yaocodes/cui-v1.0/packages/cui/components/edit/FormBuilder/index.tsx) | 组件实现（setting 加载、画布高度/全屏、侧栏+画布+面板组合、data 双向回传） |
| [types.ts](file:///home/project/yaocodes/cui-v1.0/packages/cui/components/edit/FormBuilder/types.ts) | 类型定义（Setting/Data/Field/Preset/Layout） |
| [utils.ts](file:///home/project/yaocodes/cui-v1.0/packages/cui/components/edit/FormBuilder/utils.ts) | `GetSetting` 等工具函数（请求并解析 Setting） |
| [components/Sidebar.tsx](file:///home/project/yaocodes/cui-v1.0/packages/cui/components/edit/FormBuilder/components/Sidebar.tsx) | 左侧字段类型面板（可折叠、固定、fullscreen 适配） |
| [components/Canvas.tsx](file:///home/project/yaocodes/cui-v1.0/packages/cui/components/edit/FormBuilder/components/Canvas.tsx) | 中间画布（基于 react-grid-layout，负责字段拖拽/布局、输出 {columns, form}） |
| [index.less](file:///home/project/yaocodes/cui-v1.0/packages/cui/components/edit/FormBuilder/index.less) | 组件样式（`_local` 容器/全屏态等） |
| [database.form.yao](file:///home/project/yaoapps/lowcode/forms/sys/database.form.yao) | 低代码配置格式参考 |
| [Panel types.tsx](file:///home/project/yaocodes/cui-v1.0/packages/cui/widgets/Panel/types.tsx) | Setting.types 中 PanelType / Section / ColumnComponent 的真实类型定义 |
| [components/edit/README](../README.md) | edit/ 下 30 个组件的 README 总索引(所有组件名及文档链接) |
