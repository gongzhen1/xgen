# List 组件

低代码表单列表容器组件，用于渲染字段分组或重复性结构。

## 一、快速开始

```tsx
import List from '@cui/components/builder/List'

function BuilderDemo() {
  return (
    <List
      __bind="fieldName"
      __name="字段名"
      placeholder="请输入内容"
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
import List from '@cui/components/builder/List'

<List /* 基础 Props */ />
```

**示例 2：扩展 Props**

```tsx
<List className="custom-class" disabled={false} />
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/List/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/List/index.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/List/model.ts
