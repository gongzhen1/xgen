# FileViewer 组件

文件预览查看器组件，支持图片、PDF、文档等多类型预览与下载。

## 一、快速开始

通过 `.table.yao` / `.form.yao` 配置中 `view.type = "FileViewer"` 来使用本展示组件。

```json
{
  "columns": [
    {
      "name": "合同附件",
      "bind": "contractFile",
      "view": {
        "type": "FileViewer",
        "props": {
          "fileNameBind": "contractFileName"
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
| `showMaximize` | `boolean` | `-` | - |
| `src` | `string` | `-` | - |
| `file` | `File` | `-` | - |
| `content` | `string // 新增：直接传递文本内容` | `-` | - |
| `contentType` | `string` | `-` | - |
| `style` | `React.CSSProperties` | `-` | - |
| `fileID` | `string` | `-` | 新增支持通过 file ID 和 uploader 加载文件 |
| `uploader` | `string` | `-` | - |

## 三、用法示例

**示例 1：基础展示**

```json
{
  "columns": [
    {
      "name": "示例",
      "bind": "value",
      "view": {
        "type": "FileViewer",
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
        "type": "FileViewer",
        "props": {
          "className": "custom-fileviewer"
        }
      }
    }
  ]
}
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/FileViewer/docs.md
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/FileViewer/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/FileViewer/index.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/FileViewer/pptx/index.ts
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/FileViewer/pptx/parser.ts
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/FileViewer/pptx/styles.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/FileViewer/pptx/types.ts
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/FileViewer/pptx/utils.ts
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/FileViewer/viewers/Audio.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/FileViewer/viewers/Docx.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/FileViewer/viewers/Image.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/FileViewer/viewers/Pdf.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/FileViewer/viewers/Pptx.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/FileViewer/viewers/Text.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/FileViewer/viewers/Unsupported.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/view/FileViewer/viewers/Video.tsx
