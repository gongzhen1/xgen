# Button 组件

通用按钮组件，支持多种类型、尺寸、加载状态与图标。

## 一、快速开始

```tsx
import Button from '@cui/components/ui/Button'

function Demo() {
  return (
    <Button type="primary" size="medium" onClick={() => console.log('clicked')}>
      确认提交
    </Button>
  )
}
```

## 二、Props 配置表

暂无显式 Props 定义，请参考组件源码或上方快速开始示例。

## 三、用法示例

**示例 1：三种按钮类型 + 禁用态**

```tsx
<>
  <Button type="primary">主操作</Button>
  <Button type="default">次操作</Button>
  <Button type="danger">危险操作</Button>
  <Button disabled>禁用中</Button>
</>
```

**示例 2：加载状态 + 图标按钮**

```tsx
<Button loading loadingIcon="material-refresh" onClick={submitForm}>
  提交中...
</Button>
```

**示例 3：不同尺寸组合**

```tsx
<>
  <Button size="small">小号</Button>
  <Button size="medium">中号</Button>
  <Button size="large">大号</Button>
</>
```

## 四、相关文件

- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/Button/index.less
- file:///home/project/yaocodes/cui-v1.0/packages/cui/components/ui/Button/index.tsx
