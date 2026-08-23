# Setting 组件

通用配置表单组件，传入 ProviderSchema 即可自动渲染各类输入控件并支持校验。

## 一、快速开始

```tsx
import Setting from '@cui/components/ui/Setting'
import { useRef } from 'react'

function Demo() {
  const ref = useRef<{ validate: () => boolean }>()
  const schema = {
    id: 'demo',
    required: ['name'],
    properties: {
      name: { type: 'string', title: '名称', required: true }
    }
  }
  return (
    <Setting schema={schema} onChange={(v) => console.log(v)} ref={ref} />
  )
}
```

## 二、Props 配置表

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `schema` | `ProviderSchema` | `-` | Schema definition |
| `value` | `Record<string, PropertyValue>` | `-` | Current values |
| `onChange` | `(values: Record<string, PropertyValue>) => void /** CSS class */ className?: string` | `-` | Change callback |

## 三、用法示例

**示例 1：根据 Schema 自动渲染表单**

```tsx
<Setting
  schema={{
    id: 'demo-schema',
    required: ['name'],
    properties: {
      name: { type: 'string', title: '名称', component: 'Input', order: 1 },
      desc: { type: 'string', title: '描述', component: 'TextArea', order: 2 },
      enabled: { type: 'boolean', title: '启用', component: 'Switch', order: 3 }
    }
  }}
  value={formValue}
  onChange={(v) => setFormValue(v)}
/>
```

**示例 2：外部触发校验**

```tsx
const ref = useRef<{ validate: () => boolean }>()
const handleSave = () => {
  if (ref.current?.validate()) save()
}
<Setting ref={ref} schema={schema} value={v} onChange={setV} />
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/Setting/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/Setting/index.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/Setting/types.ts
