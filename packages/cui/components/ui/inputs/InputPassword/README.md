# InputPassword 组件

密码输入框组件，支持切换明文显示、防浏览器自动填充与长度限制。

## 一、快速开始

```tsx
import InputPassword from '@cui/components/ui/inputs/InputPassword'

function Demo() {
  const schema = {
    type: 'string',
    title: '演示字段',
    placeholder: '请输入内容'
  }
  return (
    <InputPassword
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
| `schema` | `PropertySchema` | `-` | 字段 Schema 定义（含 title、description、placeholder、disabled、readOnly、enum、minimum、maximum 等） |
| `value` | `PropertyValue` | `-` | 当前字段值 |
| `onChange` | `(value: PropertyValue) => void` | `-` | 值变化回调 |
| `onBlur` | `() => void` | `-` | 失焦回调（可选） |
| `error` | `string` | `-` | 错误提示信息 |
| `hasError` | `boolean` | `-` | 是否显示错误态样式 |

## 三、用法示例

**示例 1：基础用法**

```tsx
import InputPassword from '@cui/components/ui/inputs/InputPassword'

<InputPassword /* 基础 Props */ />
```

**示例 2：扩展 Props**

```tsx
<InputPassword className="custom-class" disabled={false} />
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/inputs/InputPassword/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/inputs/InputPassword/index.tsx
