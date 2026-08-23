# Input 组件

通用文本输入框组件，基于 Schema 驱动，支持长度限制、正则模式与只读/禁用。

## 一、快速开始

```tsx
import Input from '@cui/components/ui/inputs/Input'

function Demo() {
  const schema = {
    type: 'string',
    title: '演示字段',
    placeholder: '请输入内容'
  }
  return (
    <Input
      schema={schema}
      value=""
      onChange={(v) => console.log(v)}
    />
  )
}
```

## 二、Props 配置表

暂无显式 Props 定义，请参考组件源码或上方快速开始示例。

## 三、用法示例

**示例 1：基础用户名输入**

```tsx
<Input
  schema={{ type: 'string', title: '用户名', placeholder: '请输入用户名' }}
  value={username}
  onChange={(v) => setUsername(v)}
/>
```

**示例 2：只读 + 禁用态**

```tsx
<Input
  schema={{ type: 'string', title: '创建人', disabled: true }}
  value="admin"
  onChange={() => {}}
/>
```

**示例 3：手机号（长度 + 正则）+ 错误展示**

```tsx
<Input
  schema={{
    type: 'string',
    title: '手机号',
    placeholder: '请输入手机号',
    maxLength: 11,
    pattern: '^1[3-9]\\d{9}$'
  }}
  value={phone}
  onChange={(v) => setPhone(v)}
  hasError={!!phoneError}
  error={phoneError}
/>
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/Input/index.tsx
