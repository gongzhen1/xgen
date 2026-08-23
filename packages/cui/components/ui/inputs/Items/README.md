# Items 组件

数组项动态容器组件，用于 Schema 中 array 类型的子项增删与渲染。

## 一、快速开始

```tsx
import Items from '@cui/components/ui/inputs/Items'

function Demo() {
  const schema = {
    type: 'string',
    title: '演示字段',
    placeholder: '请输入内容'
  }
  return (
    <Items
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
| `value` | `PropertyValue[]` | `-` | - |
| `onChange` | `(v: PropertyValue[]) => void renderItem: (itemVal: PropertyValue, idx: number) => React.ReactNode addItem: () => void removeItem: (idx: number) => void` | `-` | - |

## 三、用法示例

**示例 1：基础用法**

```tsx
import Items from '@cui/components/ui/inputs/Items'

<Items /* 基础 Props */ />
```

**示例 2：扩展 Props**

```tsx
<Items className="custom-class" disabled={false} />
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/inputs/Items/index.tsx
