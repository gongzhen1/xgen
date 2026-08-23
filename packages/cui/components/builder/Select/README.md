# Select 组件

下拉选择器组件，支持分组选项、搜索与自定义渲染。

## 一、快速开始

```tsx
import Select from '@cui/components/ui/inputs/Select'

function Demo() {
  const schema = {
    type: 'string',
    title: '演示字段',
    placeholder: '请输入内容'
  }
  return (
    <Select
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
| `extend` | `boolean` | `-` | - |
| `extendValue` | `boolean` | `-` | - |
| `extendValuePlaceholder` | `string` | `-` | - |
| `extendLabelPlaceholder` | `string` | `-` | - |

## 三、用法示例

**示例 1：基础用法**

```tsx
import Select from '@cui/components/builder/Select'

<Select /* 基础 Props */ />
```

**示例 2：扩展 Props**

```tsx
<Select className="custom-class" disabled={false} />
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/Select/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/Select/index.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/Select/model.ts
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/Select/types.ts
