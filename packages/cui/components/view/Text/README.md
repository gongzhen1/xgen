# Text 组件

文本展示组件，支持字重/颜色/尺寸配置、时间格式化与样式化值对象。

## 一、快速开始

通过 `.table.yao` / `.form.yao` 配置中 `view.type = "Text"` 来使用本展示组件。

```json
{
  "columns": [
    {
      "name": "创建时间",
      "bind": "createdAt",
      "view": {
        "type": "Text",
        "props": {
          "format": "YYYY-MM-DD HH:mm",
          "color": "primary",
          "size": 14
        }
      }
    }
  ]
}
```

## 二、Props 配置表

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `__value` | `Value \| StyledValue` | `-` | - |
| `weight` | `\| 'thin' \| 'extralight' \| 'light' \| 'normal' \| 'medium' \| 'semibold' \| 'bold' \| 'extrabold' \| 'black' \| number` | `-` | - |
| `color` | `string` | `-` | - |
| `format` | `string` | `-` | - |
| `size` | `number` | `-` | - |

## 三、用法示例

**示例 1：基础展示**

```json
{
  "columns": [
    {
      "name": "示例",
      "bind": "value",
      "view": {
        "type": "Text",
        "props": {}
      }
    }
  ]
}
```

**示例 2：时间格式化 + 预设色**

```json
{
  "columns": [
    {
      "name": "更新时间",
      "bind": "updatedAt",
      "view": {
        "type": "Text",
        "props": {
          "format": "YYYY-MM-DD",
          "color": "grey",
          "weight": "medium"
        }
      }
    }
  ]
}
```

**示例 3：样式化值对象（value+color 组合）**

```json
{
  "columns": [
    {
      "name": "动态状态",
      "bind": "styledStatus",
      "view": {
        "type": "Text",
        "props": {}
      }
    }
  ]
}
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/Text/index.tsx
