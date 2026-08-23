# DateRange 组件

日期范围选择器，支持预设快捷选项（最近7天/30天）与自定义范围。

## 一、快速开始

```tsx
import DateRange from '@cui/components/ui/inputs/DateRange'

function Demo() {
  const schema = {
    type: 'string',
    title: '演示字段',
    placeholder: '请输入内容'
  }
  return (
    <DateRange
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
| `value` | `DateRangeValue` | `{ start: null, end: null }` | - |
| `onChange` | `(value: DateRangeValue) => void placeholder?: string disabled?: boolean presets?: Array<{ label: string value: DateRangeValue }> format?: string size?: 'small' \| 'default' \| 'large' className?: string placement?: 'bottomLeft' \| 'bottomRight' \| 'topLeft' \| 'topRight' \| 'auto'` | `-` | - |

## 三、用法示例

**示例 1：自定义快捷预设**

```tsx
<DateRange
  value={range}
  onChange={(v) => setRange(v)}
  presets={[
    { label: '今天', value: { start: today(), end: today() } },
    { label: '本周', value: { start: weekStart(), end: today() } }
  ]}
/>
```

**示例 2：禁用 + 大号**

```tsx
<DateRange disabled size="large" value={range} onChange={() => {}} />
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/inputs/DateRange/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/inputs/DateRange/index.tsx
