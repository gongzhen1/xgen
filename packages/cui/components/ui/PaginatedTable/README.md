# PaginatedTable 组件

带分页器的数据表格组件，内置操作列与自定义分页控制。

## 一、快速开始

```tsx
import PaginatedTable from '@cui/components/ui/PaginatedTable'

function Demo() {
  const columns = [
    { key: 'id', title: 'ID', dataIndex: 'id', width: 80 },
    { key: 'name', title: '名称', dataIndex: 'name', minWidth: 150 }
  ]
  return (
    <PaginatedTable
      data={[{ id: 1, name: 'foo' }]}
      columns={columns}
      total={1}
      current={1}
      pageSize={10}
      onPageChange={(p) => console.log(p)}
    />
  )
}
```

## 二、Props 配置表

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `data` | `T[] \| null` | `-` | 数据相关 |
| `columns` | `TableColumn<T>[]` | `-` | - |
| `loading` | `boolean` | `-` | - |
| `total` | `number` | `-` | - |
| `rowKey` | `string \| ((record: T, index: number) => string) // 分页相关 current?: number pageSize?: number onPageChange?: (page: number, pageSize: number) => void onPageSizeChange?: (current: number, size: number) => void showSizeChanger?: boolean showQuickJumper?: boolean showTotal?: boolean showPagination?: boolean // 新增：控制是否显示分页 // 操作相关 actions?: TableAction<T>[] actionsTitle?: string // 自定义操作列标题 // 样式相关 size?: 'small' \| 'middle' \| 'large' // 空状态 emptyText?: React.ReactNode` | `-` | - |

## 三、用法示例

**示例 1：带操作列 + 分页**

```tsx
<PaginatedTable
  data={list}
  columns={columns}
  total={totalCount}
  current={page}
  pageSize={pageSize}
  actionsTitle="操作"
  actions={[
    { key: 'view', label: '查看', icon: 'material-visibility', onClick: (r) => goDetail(r) },
    { key: 'edit', label: '编辑', icon: 'material-edit', onClick: (r) => goEdit(r) },
    { key: 'delete', label: '删除', icon: 'material-delete', onClick: (r) => doDelete(r) }
  ]}
  onPageChange={(p, s) => fetchList(p, s)}
  onPageSizeChange={(p, s) => fetchList(p, s)}
/>
```

**示例 2：仅展示不分页**

```tsx
<PaginatedTable
  data={shortList}
  columns={columns}
  showPagination={false}
  showTotal={false}
/>
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/PaginatedTable/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/PaginatedTable/index.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/PaginatedTable/types.ts
