# RadioGroup 组件

单选框组组件，支持分组选项、键盘操作与描述文本。

## 一、快速开始

```tsx
import RadioGroup from '@cui/components/ui/inputs/RadioGroup'

function Demo() {
  const schema = {
    type: 'string',
    title: '演示字段',
    placeholder: '请输入内容'
  }
  return (
    <RadioGroup
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

**示例 1：基础用法**

```tsx
import RadioGroup from '@cui/components/builder/RadioGroup'

<RadioGroup /* 基础 Props */ />
```

**示例 2：扩展 Props**

```tsx
<RadioGroup className="custom-class" disabled={false} />
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/RadioGroup/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/RadioGroup/index.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/RadioGroup/model.ts
