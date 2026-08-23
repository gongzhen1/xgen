# Pagination 组件

通用分页器组件，支持页码切换、上下页与信息展示。

## 一、快速开始

```tsx
import Pagination from '@cui/components/ui/Pagination'

function Demo() {
  return (
    <Pagination
      current={1}
      total={100}
      pageSize={10}
      onChange={(page) => console.log(page)}
    />
  )
}
```

## 二、Props 配置表

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `current` | `number` | `-` | - |
| `total` | `number` | `-` | - |
| `pageSize` | `number` | `-` | - |
| `onChange` | `(page: number) => void showInfo?: boolean maxVisiblePages?: number itemName?: string // 项目名称，如 "文档", "集合" 等 showPrevNext?: boolean // 是否显示上一页下一页按钮` | `-` | - |

## 三、用法示例

**示例 1：标准分页**

```tsx
<Pagination
  current={page}
  total={156}
  pageSize={10}
  onChange={(p) => goPage(p)}
/>
```

**示例 2：极简模式（无上下页按钮）**

```tsx
<Pagination
  showInfo={false}
  showPrevNext={false}
  maxVisiblePages={3}
  current={2}
  total={80}
  pageSize={10}
  onChange={onPage}
/>
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/Pagination/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/Pagination/index.tsx
