# Checkbox 组件

复选框展示组件，用于只读场景下布尔勾选状态的可视化。

## 一、快速开始

通过 `.table.yao` / `.form.yao` 配置中 `view.type = "Checkbox"` 来使用本展示组件。

```json
{
  "columns": [
    {
      "name": "是否启用",
      "bind": "enabled",
      "view": {
        "type": "Checkbox",
        "props": {}
      }
    }
  ]
}
```

## 二、Props 配置表

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | `-` | - |

## 三、用法示例

**示例 1：基础展示**

```json
{
  "columns": [
    {
      "name": "示例",
      "bind": "value",
      "view": {
        "type": "Checkbox",
        "props": {}
      }
    }
  ]
}
```

**示例 2：自定义 Props 扩展**

```json
{
  "columns": [
    {
      "name": "自定义",
      "bind": "value",
      "view": {
        "type": "Checkbox",
        "props": {
          "className": "custom-checkbox"
        }
      }
    }
  ]
}
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/Checkbox/index.tsx
