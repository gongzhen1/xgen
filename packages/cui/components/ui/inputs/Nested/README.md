# Nested 组件

嵌套对象表单容器组件，用于 Schema 中 object 类型的嵌套字段渲染。

## 一、快速开始

```tsx
import Nested from '@cui/components/ui/inputs/Nested'

function Demo() {
  const schema = {
    type: 'string',
    title: '演示字段',
    placeholder: '请输入内容'
  }
  return (
    <Nested
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
| `schema` | `PropertySchema` | `-` | - |
| `value` | `PropertyValue` | `-` | - |
| `onChange` | `(v: PropertyValue) => void children?: React.ReactNode` | `-` | - |

## 三、用法示例

**示例 1：基础用法**

```tsx
import Nested from '@cui/components/ui/inputs/Nested'

<Nested /* 基础 Props */ />
```

**示例 2：扩展 Props**

```tsx
<Nested className="custom-class" disabled={false} />
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/inputs/Nested/index.tsx
