# Image 组件

图片展示组件，支持懒加载、失败兜底图、固定尺寸与点击放大预览。

## 一、快速开始

通过 `.table.yao` / `.form.yao` 配置中 `view.type = "Image"` 来使用本展示组件。

```json
{
  "columns": [
    {
      "name": "封面图",
      "bind": "coverUrl",
      "view": {
        "type": "Image",
        "props": {
          "width": 80,
          "height": 60,
          "preview": true,
          "fit": "cover"
        }
      }
    }
  ]
}
```

## 二、Props 配置表

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `previewURL` | `string` | `-` | - |
| `useAppRoot` | `boolean` | `-` | - |
| `api` | `string \| { api: string; params: string }` | `-` | - |

## 三、用法示例

**示例 1：基础展示**

```json
{
  "columns": [
    {
      "name": "示例",
      "bind": "value",
      "view": {
        "type": "Image",
        "props": {}
      }
    }
  ]
}
```

**示例 2：固定尺寸 + 兜底图**

```json
{
  "columns": [
    {
      "name": "用户头像",
      "bind": "avatar",
      "view": {
        "type": "Image",
        "props": {
          "width": 40,
          "height": 40,
          "fit": "cover",
          "fallback": "/assets/default-avatar.png"
        }
      }
    }
  ]
}
```

**示例 3：点击放大预览**

```json
{
  "columns": [
    {
      "name": "产品图片",
      "bind": "productImage",
      "view": {
        "type": "Image",
        "props": {
          "width": 100,
          "preview": true
        }
      }
    }
  ]
}
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/Image/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/Image/index.tsx
