# ChatBox 组件

聊天输入框组件，支持多附件上传、Ctrl+Enter 发送与加载状态。

## 一、快速开始

```tsx
import ChatBox from '@cui/components/ui/inputs/ChatBox'

function Demo() {
  const schema = {
    type: 'string',
    title: '演示字段',
    placeholder: '请输入内容'
  }
  return (
    <ChatBox
      schema={schema}
      value=""
      onChange={(v) => console.log(v)}
    />
  )
}
```

## 二、Props 配置表

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `onSend` | `(message: string, files: ChatBoxFile[]) => void onFilesChange?: (files: ChatBoxFile[]) => void files?: ChatBoxFile[] maxFiles?: number acceptFileTypes?: string sendButtonText?: string placeholder?: string disabled?: boolean loading?: boolean` | `-` | - |

## 三、用法示例

**示例 1：基础用法**

```tsx
import ChatBox from '@cui/components/ui/inputs/ChatBox'

<ChatBox /* 基础 Props */ />
```

**示例 2：扩展 Props**

```tsx
<ChatBox className="custom-class" disabled={false} />
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/inputs/ChatBox/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/inputs/ChatBox/index.tsx
