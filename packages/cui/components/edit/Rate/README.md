# Rate 星星评分组件

基于 [Ant Design Rate](https://ant.design/components/rate-cn) 封装的低代码表单字段组件,通过 `.form.yao` 中的 `edit.type = "Rate"` 声明使用。

支持:**自定义总分(星星数)**、**默认评分**、**用户交互修改评分**、**按分数高亮星星颜色**、**半星**、**只读禁用**、**自定义星星字符** 与 **自定义颜色**。

---

## 一、基本用法

在任意 `.form.yao` 的 `fields.form` 对象中添加一个字段,并在 `layout.form.sections[*].columns` 中声明即可:

```json
{
  "fields": {
    "form": {
      "满意度评分": {
        "bind": "satisfaction",
        "edit": {
          "type": "Rate",
          "props": {
            "count": 5,
            "defaultValue": 3
          }
        }
      }
    }
  },
  "layout": {
    "form": {
      "sections": [
        {
          "title": "评价信息",
          "columns": [
            { "name": "满意度评分", "width": 24 }
          ]
        }
      ]
    }
  }
}
```

渲染效果:显示 5 颗星星,前 3 颗高亮(默认分 3)。用户点击星星即可修改评分,数据自动通过表单的 `bind: satisfaction` 双向绑定写入模型。

> 低代码加载机制参考 [database.form.yao](file:///home/project/yaoapps/lowcode/forms/sys/database.form.yao) 的格式:字段声明在 `fields.form` 中,展示顺序在 `layout.form.sections[*].columns` 里以 `name` 引用。组件通过 `edit.type = "Rate"` 映射到 [Rate/index.tsx](file:///home/project/yaocodes/cui-v1.0/packages/cui/components/edit/Rate/index.tsx)。

---

## 二、Props 配置清单

所有配置放在 `fields.form.<字段名>.edit.props` 下。

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `count` | `number` | `5` | 总分(星星总数) |
| `defaultValue` | `number` | `0` | **默认评分(星数)**。表单未加载数据(未注入 value)时使用;表单已加载数据时以数据为准 |
| `allowClear` | `boolean` | `true` | 再次点击选中星时是否清除为 0 |
| `allowHalf` | `boolean` | `false` | 是否允许半星(0.5 精度) |
| `disabled` | `boolean` | `false` | 只读禁用(用于展示态/查看页) |
| `readOnly` | `boolean` | `false` | 只读,样式上仍保留可感(hover 不改变选中星) |
| `character` | `ReactNode \| (index) => ReactNode` | 默认星形(`★`) | 自定义星星字符,可传 emoji/icon |
| `autoFocus` | `boolean` | `false` | 自动获得焦点 |
| `tabIndex` | `number` | `0` | Tab 顺序 |
| `style` | `CSSProperties` | — | 行内样式;可用 `{ color: '#faad14' }` 直接改星星填充色,或配合 CSS 变量 `--rate-color` |
| `className` | `string` | — | 自定义 class |
| `itemProps` | `{ rules, label, ... }` | — | 传递给外层 `Form.Item`(必填校验、label 等);与其他组件写法一致 |

---

## 三、完整示例(参考 database.form.yao 结构)

把下面两段粘贴到你自己的 `.form.yao` 对应位置即可。

### 1. `fields.form` 中定义字段

```jsonc
// file: my_app.form.yao
{
  "fields": {
    "form": {
      // ... 原有字段

      "综合评分": {
        "bind": "score",
        "edit": {
          "type": "Rate",
          "props": {
            "count": 5,
            "defaultValue": 4,
            "allowHalf": true,
            "itemProps": {
              "label": "服务质量",
              "rules": [
                { "required": true, "message": "请先进行评分" }
              ]
            }
          }
        }
      },

      "难度等级": {
        "bind": "difficulty",
        "edit": {
          "type": "Rate",
          "props": {
            "count": 10,
            "defaultValue": 0,
            "allowClear": true,
            "style": { "color": "#52c41a" }
          }
        }
      },

      "安全评级(只读)": {
        "bind": "security_rating",
        "edit": {
          "type": "Rate",
          "props": {
            "count": 5,
            "disabled": true
          }
        }
      },

      "表情打分": {
        "bind": "mood",
        "edit": {
          "type": "Rate",
          "props": {
            "count": 5,
            "defaultValue": 2,
            "character": "🙂"
          }
        }
      }
    }
  }
}
```

### 2. `layout.form.sections[*].columns` 中引用展示

```jsonc
{
  "layout": {
    "form": {
      "sections": [
        {
          "title": "评分项",
          "columns": [
            { "name": "综合评分", "width": 24 },
            { "name": "难度等级", "width": 24 },
            { "name": "安全评级(只读)", "width": 12 },
            { "name": "表情打分", "width": 12 }
          ]
        }
      ]
    }
  }
}
```

---

## 四、星星颜色(分数显示)

### 4.1 默认行为
已选中星(全星 `star-full`、半星 `star-half`)默认取主题主色 `--color_main`(亮/暗主题下都生效,代码在 [Rate/index.less](file:///home/project/yaocodes/cui-v1.0/packages/cui/components/edit/Rate/index.less#L1-L27)):

```
亮主题:按站点设置的主色填充(若未设置则回退到 #fadb14 金色)
暗主题:与亮主题一致,颜色跟随主题主色
```

### 4.2 自定义颜色(任选一种)

**A. 单组件通过 `props.style` 直接指定(推荐,局部生效)**

```json
"edit": {
  "type": "Rate",
  "props": {
    "count": 5,
    "style": { "color": "#faad14" }
  }
}
```

**B. 通过 CSS 变量 `--rate-color` 作用域生效(方便批量复用)**

```css
.my-score-section {
  --rate-color: #eb2f96;
}
```

所有该作用域下的 Rate 组件都会统一使用粉色。

### 4.3 视觉说明
- **已选中(分数部分)**:按上述颜色高亮
- **未选中(剩余部分)**:默认灰色(antd 自带)
- **半星**:只高亮左半部分(配合 `allowHalf: true`)

---

## 五、常见场景

### 5.1 10 分制 + 默认 5 分 + 半星支持
```json
"edit": {
  "type": "Rate",
  "props": {
    "count": 10,
    "defaultValue": 5,
    "allowHalf": true
  }
}
```

### 5.2 必填校验 + 表单 label
```json
"edit": {
  "type": "Rate",
  "props": {
    "count": 5,
    "itemProps": {
      "label": "整体满意吗",
      "rules": [
        { "required": true, "message": "请评分后再提交" }
      ]
    }
  }
}
```

### 5.3 详情页只读展示(用户不能改)
```json
"edit": {
  "type": "Rate",
  "props": {
    "count": 5,
    "disabled": true
  }
}
```

### 5.4 Emoji 评级(5 颗表情)
```json
"edit": {
  "type": "Rate",
  "props": {
    "count": 5,
    "defaultValue": 3,
    "character": "🙂"
  }
}
```

---

## 六、工作原理(给维护者)

1. **组件入口**:`X` 分发器根据 `edit.type = "Rate"` 动态加载 [edit/Rate/index.tsx](file:///home/project/yaocodes/cui-v1.0/packages/cui/components/edit/Rate/index.tsx)(Umi 的 `@/components/${type}/${name}` 路径),无需手动注册。
2. **受控/默认值兼容**:`Form.Item` 会向直接子组件注入 `value` / `onChange`,表单未赋值时为 `undefined`,组件内部用 `Inner` 子组件 `useState(defaultValue ?? 0)` 兜底,保证 `.yao` 里写的 `defaultValue` 在新建表单时也能生效。
3. **颜色覆盖**:`._local` 全局覆盖 `.xgen-rate-star-full / star-half` 的选中色,使用 `--rate-color` → `--color_main` → `#fadb14` 的变量降级链,同时在 `[data-theme='dark']` 下也保持一致。

---

## 七、相关文件

| 文件 | 说明 |
|---|---|
| [Rate/index.tsx](file:///home/project/yaocodes/cui-v1.0/packages/cui/components/edit/Rate/index.tsx) | 组件实现(Wrapper + Inner 受控适配) |
| [Rate/index.less](file:///home/project/yaocodes/cui-v1.0/packages/cui/components/edit/Rate/index.less) | 选中星高亮样式 + 暗色主题适配 |
| [database.form.yao](file:///home/project/yaoapps/lowcode/forms/sys/database.form.yao) | 低代码配置格式参考(字段声明 + 布局 sections + columns) |
