# Provider 组件

服务提供者配置器组件，根据 Provider 类型 + JSON Schema 动态渲染配置表单。

## 一、快速开始

```tsx
import ProviderConfigurator from '@cui/components/ui/Provider'
import { useRef } from 'react'

function Demo() {
  const ref = useRef<{ validateAllFields: () => boolean }>()
  return (
    <ProviderConfigurator
      type="chunking"
      mode="detailed"
      onChange={(v) => console.log(v)}
      ref={ref}
    />
  )
}
```

## 二、Props 配置表

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `type` | `string` | `-` | Currently only 'chunkings' is used, but the API allows other types |
| `value` | `{ id?: string; properties?: Values }` | `-` | Optional controlled value |
| `onChange` | `(next: { id: string; properties: Values }) => void // Optional className for outer container className?: string // Configurable labels for the provider selector labels?: {` | `-` | Change notification to parent |
| `name` | `string` | `-` | - |
| `description` | `string } // Display mode: 'simple' only shows provider selector, 'detailed' shows full configuration mode?: 'simple' \| 'detailed'` | `-` | - |

## 三、用法示例

**示例 1：简单模式（仅选择 Provider）**

```tsx
<ProviderConfigurator
  type="embedding"
  mode="simple"
  onChange={(v) => console.log(v.id, v.properties)}
/>
```

**示例 2：详细模式 + 外部校验**

```tsx
const ref = useRef<{ validateAllFields: () => boolean }>()
<ProviderConfigurator
  ref={ref}
  type="chunking"
  mode="detailed"
  onChange={onProviderChange}
/>
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/Provider/Select/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/Provider/Select/index.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/Provider/hooks/useProviderInfo.ts
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/Provider/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/Provider/index.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/Provider/mock.ts
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/Provider/types.ts
