# Color 组件

颜色值展示组件，渲染色板色块 + HEX/RGB 代码。

## 一、快速开始

通过 `.table.yao` / `.form.yao` 配置中 `view.type = "Color"` 来使用本展示组件。

```json
{
  "columns": [
    {
      "name": "品牌色",
      "bind": "brandColor",
      "view": {
        "type": "Color",
        "props": {
          "showCode": true
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
        "type": "Color",
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
        "type": "Color",
        "props": {
          "className": "custom-color"
        }
      }
    }
  ]
}
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/Color/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/Color/index.tsx
