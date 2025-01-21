# vite-plugin-i18n-highlighter

vite-plugin-i18n-highlighter 是一个用于高亮 Vue 文件中可翻译文本的 Vite 插件，方便开发者快速识别和修改翻译内容。它支持通过快捷键进入高亮模式，并提供弹窗编辑功能。

### 功能特性

- [ x ]	自动高亮： 高亮 Vue 文件中 t() 方法调用的翻译内容和绑定的属性。

- [ x ] 快捷键切换： 使用 Ctrl + Shift + H 快捷键切换高亮模式。

- [ x ]	弹窗编辑： 点击高亮元素后弹出编辑框，可以预览或保存翻译修改。

- [  ] 修改提示： 提示开发者当前有哪些翻译内容被修改，支持通过接口保存到后端。


### 使用方法

#### 配置插件

在 Vite 配置文件（vite.config.js 或 vite.config.ts）中引入插件：

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import i18nHighlighterPlugin from 'vite-plugin-i18n-highlighter'

export default defineConfig({
  plugins: [
    vue(),
    i18nHighlighterPlugin()
  ]
})
```

#### 快捷键切换高亮模式
  -	进入/退出高亮模式：在浏览器中按下 Ctrl + Shift + H 切换高亮模式。
  -	高亮模式下，页面中所有调用 t() 方法的翻译内容将被高亮，并允许点击以编辑内容。

#### 编辑翻译
  - 进入高亮模式后，点击高亮的文本或元素。
  - 弹出编辑框，显示翻译的 key 和当前内容。
  - 修改内容后可以选择：
    -	预览：立即在页面中应用修改（仅本地预览）。
    -	保存：确认后将修改内容通过接口保存到后端。
    -	关闭：取消编辑并关闭弹窗。


### 插件效果

#### 默认模式

正常加载页面时，所有内容以非高亮状态显示。

#### 高亮模式

按下快捷键进入高亮模式后，页面中调用 t() 的翻译内容会被高亮，未翻译的部分不会受影响。

高亮示例：

```html
<span data-i18n-key="welcome_message">{{ t('welcome_message') }}</span>
```

#### 编辑弹窗

点击高亮的翻译文本后，弹窗将显示如下内容：
-	翻译 Key：展示翻译的 key 值（只读）。
- 翻译内容：当前的翻译内容（可编辑）。
- 操作按钮：
- 预览：即时更新页面中的翻译内容。
- 保存：通过接口保存修改。
- 关闭：取消编辑并退出。

#### 自定义配置

如果需要自定义接口地址或修改弹窗样式，可以直接修改插件代码中对应的部分。

修改以下代码以适配你的后端保存接口：

```js
function saveChangesToAPI(translations) {
    fetch('/api/save-translation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(translations)
    })
    .then(response => response.json())
    .then(data => console.log('保存成功:', data))
    .catch(error => console.error('保存失败:', error));
}
```

将 '/api/save-translation' 替换为你的后端保存接口地址。

#### 自定义弹窗样式

编辑 transformIndexHtml 中注入的样式部分，调整高亮效果或弹窗的样式。


#### 注意事项
-	该插件仅对 Vue 单文件组件（.vue 文件）生效。
-	需要确保项目中使用 t() / $t() 方法调用翻译函数。
- 保存功能依赖后端接口，请根据实际需求配置接口地址。
