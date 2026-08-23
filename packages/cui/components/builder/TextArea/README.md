# TextArea 组件

多行文本输入框组件，支持自适应高度与占位提示。

## 一、快速开始

```tsx
import TextArea from '@cui/components/ui/inputs/TextArea'

function Demo() {
  const schema = {
    type: 'string',
    title: '演示字段',
    placeholder: '请输入内容'
  }
  return (
    <TextArea
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
import TextArea from '@cui/components/builder/TextArea'

<TextArea /* 基础 Props */ />
```

**示例 2：扩展 Props**

```tsx
<TextArea className="custom-class" disabled={false} />
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/TextArea/index.tsx
