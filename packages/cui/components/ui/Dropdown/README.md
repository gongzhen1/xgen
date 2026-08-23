# Dropdown 组件

下拉菜单组件，支持点击/悬浮触发与多方向弹出。

## 一、快速开始

```tsx
import Dropdown from '@cui/components/ui/Dropdown'

function Demo() {
  const items = [
    { key: 'edit', label: '编辑', onClick: () => {} },
    { key: 'delete', label: '删除', onClick: () => {}, disabled: true }
  ]
  return (
    <Dropdown items={items} trigger="click" placement="bottomRight">
      <button>更多操作 ▾</button>
    </Dropdown>
  )
}
```

## 二、Props 配置表

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `children` | `ReactNode` | `-` | - |
| `items` | `DropdownMenuItem[]` | `-` | - |
| `placement` | `'bottomLeft' \| 'bottomRight' \| 'topLeft' \| 'topRight'` | `'bottomRight'` | - |
| `trigger` | `'click' \| 'hover'` | `'click'` | - |
| `className` | `string` | `''` | - |

## 三、用法示例

**示例 1：点击触发更多操作菜单**

```tsx
<Dropdown
  trigger="click"
  placement="bottomRight"
  items={[
    { key: '1', label: '重命名', onClick: () => {} },
    { key: '2', label: '移动', onClick: () => {} },
    { key: '3', label: '删除', onClick: () => {}, disabled: true }
  ]}
>
  <Button>更多 ▾</Button>
</Dropdown>
```

**示例 2：悬浮触发 + 左下弹出**

```tsx
<Dropdown trigger="hover" placement="bottomLeft" items={items}>
  <span>悬浮我</span>
</Dropdown>
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/Dropdown/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/Dropdown/index.tsx
