# ActionButton 组件

用于表格或操作栏中带图标的迷你操作按钮，支持提示气泡与禁用状态。

## 一、快速开始

```tsx
import ActionButton from '@cui/components/ui/ActionButton'

function Demo() {
  return (
    <ActionButton
      icon="material-edit"
      title="编辑"
      onClick={() => console.log('edit')}
    />
  )
}
```

## 二、Props 配置表

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `icon` | `string \| React.ReactNode` | `-` | 图标名称或React节点 |
| `iconSize` | `number` | `14` | 图标大小（仅当icon为string时有效） |
| `title` | `string` | `-` | 按钮标题/提示文字 |
| `onClick` | `() => void /** 是否禁用 */ disabled?: boolean /** 是否为危险操作 */ danger?: boolean /** 按钮类型 */ type?: 'default' \| 'primary' \| 'danger' /** 自定义样式类名 */ className?: string /** 自定义样式 */ style?: React.CSSProperties` | `-` | 点击事件 |

## 三、用法示例

**示例 1：带图标的表格操作按钮**

```tsx
<>
  <ActionButton icon="material-edit" title="编辑" onClick={onEdit} />
  <ActionButton icon="material-delete" title="删除" danger onClick={onDelete} />
</>
```

**示例 2：禁用状态 + 自定义 type**

```tsx
<ActionButton
  icon="material-lock"
  title="无权限"
  disabled
  type="default"
/>
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/ActionButton/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/ActionButton/index.tsx
