# AutoComplete 组件

自动完成输入组件，根据输入内容实时匹配候选选项。

## 一、快速开始

```tsx
import AutoComplete from '@cui/components/builder/AutoComplete'

function BuilderDemo() {
  return (
    <AutoComplete
      __bind="fieldName"
      __name="字段名"
      placeholder="请输入内容"
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
import AutoComplete from '@cui/components/builder/AutoComplete'

<AutoComplete /* 基础 Props */ />
```

**示例 2：扩展 Props**

```tsx
<AutoComplete className="custom-class" disabled={false} />
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/AutoComplete/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/AutoComplete/index.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/AutoComplete/model.ts
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/AutoComplete/types.ts
