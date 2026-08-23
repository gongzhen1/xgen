# CodeEditor 组件

代码编辑器组件，基于 Monaco Editor，自动识别语言、支持主题与 JSON 校验。

## 一、快速开始

```tsx
import CodeEditor from '@cui/components/ui/inputs/CodeEditor'

function Demo() {
  const schema = {
    type: 'string',
    title: '演示字段',
    placeholder: '请输入内容'
  }
  return (
    <CodeEditor
      schema={schema}
      value=""
      onChange={(v) => console.log(v)}
    />
  )
}
```

## 二、Props 配置表

暂无显式 Props 定义，请参考组件源码或上方快速开始示例。

## 三、用法示例

**示例 1：基础用法**

```tsx
import CodeEditor from '@cui/components/builder/CodeEditor'

<CodeEditor /* 基础 Props */ />
```

**示例 2：扩展 Props**

```tsx
<CodeEditor className="custom-class" disabled={false} />
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/CodeEditor/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/CodeEditor/index.tsx
