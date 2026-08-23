# Item 组件

低代码表单项渲染器，负责字段的标签、控件与错误信息整体布局。

## 一、快速开始

```tsx
import Item from '@cui/components/builder/Item'

function BuilderDemo() {
  return (
    <Item
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
| `children` | `JSX.Element` | `-` | - |
| `__bind` | `string` | `-` | - |
| `__name` | `string` | `-` | - |
| `__namespace` | `string` | `-` | - |
| `hideLabel` | `boolean` | `-` | - |

## 三、用法示例

**示例 1：基础用法**

```tsx
import Item from '@cui/components/builder/Item'

<Item /* 基础 Props */ />
```

**示例 2：扩展 Props**

```tsx
<Item className="custom-class" disabled={false} />
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/Item/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/Item/index.tsx
