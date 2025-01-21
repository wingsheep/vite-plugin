import { parse } from '@vue/compiler-sfc'
import MagicString from 'magic-string'

export default function i18nHighlighterPlugin() {
  return {
    name: 'vite-plugin-i18n-highlighter',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.vue')) return

      const { descriptor } = parse(code)
      const template = descriptor.template

      if (!template) return

      const s = new MagicString(code)
      const templateContent = template.content

      const interpolationRegex = /\{\{\s*(\$?t)\((['"`])([^'"`]+)\2\)\s*\}\}/g
      const attributeRegex = /(:\w+)="(\s*\$?t\((['"`])([^'"`]+)\3\)\s*)"/g

      let match

      while ((match = interpolationRegex.exec(templateContent))) {
        const [fullMatch, , , key] = match
        const start = match.index
        const end = start + fullMatch.length
        const markedContent = `<span class="i18n-mark" data-i18n-key="${key}">${fullMatch}</span>`
        s.overwrite(
          template.loc.start.offset + start,
          template.loc.start.offset + end,
          markedContent,
        )
      }

      while ((match = attributeRegex.exec(templateContent))) {
        const [fullMatch, attribute, methodCall, , key] = match
        const start = match.index
        const end = start + fullMatch.length
        const markedContent = `${attribute}="${methodCall}" data-i18n-key="${key}"`
        s.overwrite(
          template.loc.start.offset + start,
          template.loc.start.offset + end,
          markedContent,
        )
      }

      return {
        code: s.toString(),
        map: s.generateMap({ hires: true }),
      }
    },

    transformIndexHtml(html) {
      // 注入客户端脚本
      return html.replace(
        '</head>',
        `
          <script>
            // 高亮模式切换函数
            let isHighlightMode = false;
            const modifiedTranslations = {};

            // 启用高亮模式
            function enableHighlightMode() {
                let message = document.getElementById('i18n-highlight-message');
                if (!message) {
                  message = document.createElement('div');
                }
                message.id = 'i18n-highlight-message';
                message.textContent = '可翻译元素已高亮，可点击修改';
                document.body.appendChild(message);
                document.body.classList.add('i18n-highlight-mode');
                document.body.style.pointerEvents = 'none';  // 禁止非高亮元素点击
                document.querySelectorAll('[data-i18n-key]').forEach(element => {
                    element.style.pointerEvents = 'auto';  // 高亮元素可以点击
                    element.addEventListener('click', handleElementClick, true); // 捕获阶段绑定点击事件
                });
                message.style.display = 'block';
            }

            // 退出高亮模式
            function disableHighlightMode() {
                document.body.classList.remove('i18n-highlight-mode');
                document.body.style.pointerEvents = 'auto';  // 恢复元素点击
                document.querySelectorAll('[data-i18n-key]').forEach(element => {
                    element.removeEventListener('click', handleElementClick, true);
                });
                const message = document.getElementById('i18n-highlight-message');
                message.style.display = 'none';
                const overlay = document.getElementById('i18n-overlay');
                document.body.removeChild(overlay);
            }

            // 处理高亮元素的点击事件
            function handleElementClick(event) {
                const target = event.target.closest('[data-i18n-key]');
                if (target) {
                    event.preventDefault();  // 阻止默认行为
                    event.stopPropagation(); // 阻止事件传播
                    const key = target.getAttribute('data-i18n-key');
                    const currentContent = target.textContent.trim();
                    showEditorPopup(target, key, currentContent);
                }
            }

            // 显示编辑框
            function showEditorPopup(targetElement, key, content) {
                const existingPopup = document.getElementById('i18n-overlay');
                if (existingPopup) existingPopup.remove();

                // 创建蒙层
                const overlay = document.createElement('div');
                overlay.id = 'i18n-overlay';
                document.body.appendChild(overlay);

                // 创建编辑框
                const editor = document.createElement('div');
                editor.id = 'i18n-editor';
                editor.innerHTML = \`
                    <label>翻译 Key:</label>
                    <input type="text" value="\${key}" disabled>
                    <label>翻译内容:</label>
                    <textarea>\${content}</textarea>
                    <footer>
                      <button id="save-translation" class="primary">保存</button>
                      <button id="preview-translation" class="plain">预览</button>
                      <button id="cancel-edit" class="plain">关闭</button>
                    </footer>
                \`;
                overlay.appendChild(editor);

                // 绑定事件
                editor.querySelector('#save-translation').addEventListener('click', () => {
                    const newContent = editor.querySelector('textarea').value.trim();
                    if (confirm('确认保存修改吗？')) {
                        document.querySelectorAll(\`[data-i18n-key="\${key}"]\`).forEach(el => el.textContent = newContent);
                        modifiedTranslations[key] = newContent;
                        alert('保存成功！');
                        document.body.removeChild(editor);
                        document.body.removeChild(overlay);
                    }
                });

                editor.querySelector('#preview-translation').addEventListener('click', () => {
                    const newContent = editor.querySelector('textarea').value.trim();
                    document.querySelectorAll(\`[data-i18n-key="\${key}"]\`).forEach(el => el.textContent = newContent);
                    document.body.removeChild(overlay);
                });

                editor.querySelector('#cancel-edit').addEventListener('click', () => {
                    document.body.removeChild(overlay);
                });
            }

            // 切换高亮模式
            document.addEventListener('keydown', (event) => {
                if (event.ctrlKey && event.shiftKey && event.key === 'H') {
                    isHighlightMode = !isHighlightMode;
                    if (isHighlightMode) {
                        enableHighlightMode();
                    } else {
                        disableHighlightMode();
                    }
                }
            });

            // 注入样式
            const style = document.createElement('style');
            style.textContent = \`
                .i18n-highlight-mode [data-i18n-key] {
                    background-color: rgba(255, 255, 0, 0.3); /* 高亮背景色 */
                    border: 1px solid rgba(255, 200, 0, 0.8);
                    cursor: pointer;
                }
                #i18n-editor {
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                    background: #fff;
                    padding: 20px;
                    border-radius: 10px;
                    display: flex;
                    flex-direction: column;
                    width: 500px;
                    pointer-events: auto;
                }
                #i18n-editor label {
                  font-weight: 500;
                  margin: 10px 0;
                }

                #i18n-editor footer {
                    display: flex;
                    margin-top: 20px;
                }
                #i18n-editor footer button {
                    margin-right: 10px;
                    padding: 4px 8px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }
                #i18n-editor footer button.primary {
                    background-color: #007bff;
                    color: white;
                }
                #i18n-editor footer button.plain {
                    background-color: #f8f9fa;
                    color: #333;
                }
                #i18n-highlight-message {
                    font-family: Arial, sans-serif;
                    font-size: 16px;
                    font-weight: bold;
                    color: white;
                    background-color: rgba(0, 123, 255, 0.8);
                    padding: 10px 20px;
                    text-align: center;
                    position: fixed;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 10000;
                    display: none;
                }
                #i18n-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    z-index: 9998;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            \`;
            document.head.appendChild(style);
          </script>
        </head>`,
      )
    },
  }
}
