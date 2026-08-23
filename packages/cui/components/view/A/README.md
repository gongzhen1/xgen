# A 组件

超链接展示组件，用于 table 中渲染带跳转链接的文本。

## 一、快速开始

通过 `.table.yao` / `.form.yao` 配置中 `view.type = "A"` 来使用本展示组件。

```json
{
  "columns": [
    {
      "name": "官网链接",
      "bind": "website",
      "view": {
        "type": "A",
        "props": {
          "target": "_blank",
          "text": "访问官网"
        }
      }
    }
  ]
}
```

## 二、Props 配置表

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `href` | `string` | `-` | - |

## 三、用法示例

**示例 1：基础展示**

```json
{
  "columns": [
    {
      "name": "示例",
      "bind": "value",
      "view": {
        "type": "A",
        "props": {}
      }
    }
  ]
}
```

**示例 2：自定义显示文本**

```json
{
  "columns": [
    {
      "name": "用户主页",
      "bind": "userHomepage",
      "view": {
        "type": "A",
        "props": {
          "target": "_blank",
          "text": "前往主页"
        }
      }
    }
  ]
}
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/A/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/A/index.tsx
