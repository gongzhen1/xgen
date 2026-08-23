# Tooltip 组件

悬浮提示气泡组件，鼠标悬浮时展示额外说明信息。

## 一、快速开始

通过 `.table.yao` / `.form.yao` 配置中 `view.type = "Tooltip"` 来使用本展示组件。

```json
{
  "columns": [
    {
      "name": "标题",
      "bind": "title",
      "view": {
        "type": "Tooltip",
        "props": {
          "placement": "top",
          "tooltipBind": "description"
        }
      }
    }
  ]
}
```

## 二、Props 配置表

暂无显式 Props 定义，请参考组件源码或上方快速开始示例。

## 三、用法示例

**示例 1：基础展示**

```json
{
  "columns": [
    {
      "name": "示例",
      "bind": "value",
      "view": {
        "type": "Tooltip",
        "props": {}
      }
    }
  ]
}
```

**示例 2：长描述悬浮展示**

```json
{
  "columns": [
    {
      "name": "商品名称",
      "bind": "productName",
      "view": {
        "type": "Tooltip",
        "props": {
          "placement": "topLeft",
          "tooltipBind": "productDesc"
        }
      }
    }
  ]
}
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/Tooltip/index.tsx
