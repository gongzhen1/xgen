# Switch 组件

开关切换组件，用于布尔字段的开启/关闭控制。

## 一、快速开始

通过 `.table.yao` / `.form.yao` 配置中 `view.type = "Switch"` 来使用本展示组件。

```json
{
  "columns": [
    {
      "name": "功能开关",
      "bind": "featureFlag",
      "view": {
        "type": "Switch",
        "props": {}
      }
    }
  ]
}
```

## 二、Props 配置表

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `checkedValue` | `boolean \| string` | `-` | - |
| `unCheckedValue` | `boolean \| string` | `-` | - |

## 三、用法示例

**示例 1：基础展示**

```json
{
  "columns": [
    {
      "name": "示例",
      "bind": "value",
      "view": {
        "type": "Switch",
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
        "type": "Switch",
        "props": {
          "className": "custom-switch"
        }
      }
    }
  ]
}
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/Switch/index.tsx
