# Tag 组件

标签展示组件，支持多色映射、关闭按钮与自定义样式。

## 一、快速开始

通过 `.table.yao` / `.form.yao` 配置中 `view.type = "Tag"` 来使用本展示组件。

```json
{
  "columns": [
    {
      "name": "状态",
      "bind": "status",
      "view": {
        "type": "Tag",
        "props": {
          "colorMap": {
            "active": "green",
            "pending": "orange",
            "disabled": "gray"
          }
        }
      }
    }
  ]
}
```

## 二、Props 配置表

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `bind` | `string` | `-` | - |
| `options` | `Component.Options` | `-` | - |
| `pure` | `boolean` | `-` | - |
| `useValue` | `boolean` | `-` | - |
| `color` | `string` | `-` | - |
| `textColor` | `string` | `-` | - |

## 三、用法示例

**示例 1：基础展示**

```json
{
  "columns": [
    {
      "name": "示例",
      "bind": "value",
      "view": {
        "type": "Tag",
        "props": {}
      }
    }
  ]
}
```

**示例 2：彩色标签映射**

```json
{
  "columns": [
    {
      "name": "优先级",
      "bind": "priority",
      "view": {
        "type": "Tag",
        "props": {
          "colorMap": {
            "P0": "red",
            "P1": "orange",
            "P2": "blue"
          }
        }
      }
    }
  ]
}
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/Tag/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/Tag/index.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/Tag/model.ts
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/Tag/services.ts
