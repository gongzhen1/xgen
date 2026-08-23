# WangEditor 组件

富文本编辑器组件，基于 WangEditor，支持常用排版操作。

## 一、快速开始

```tsx
import WangEditor from '@cui/components/builder/WangEditor'

function BuilderDemo() {
  return (
    <WangEditor
      __bind="fieldName"
      __name="字段名"
      placeholder="请输入内容"
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
import WangEditor from '@cui/components/builder/WangEditor'

<WangEditor /* 基础 Props */ />
```

**示例 2：扩展 Props**

```tsx
<WangEditor className="custom-class" disabled={false} />
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/WangEditor/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/WangEditor/index.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/WangEditor/upload.ts
