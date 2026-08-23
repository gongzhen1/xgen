# Log 组件

日志查看器组件，支持实时流式输出与等级着色。

## 一、快速开始

```tsx
import Log from '@cui/components/builder/Log'

function BuilderDemo() {
  return (
    <Log
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
import Log from '@cui/components/builder/Log'

<Log /* 基础 Props */ />
```

**示例 2：扩展 Props**

```tsx
<Log className="custom-class" disabled={false} />
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/Log/LogButton.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/Log/LogView.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/Log/LogWindow.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/Log/api.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/Log/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/Log/index.tsx
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/builder/Log/types.ts
