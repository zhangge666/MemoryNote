<template>
  <div class="ai-sidebar">
    <!-- 头部 -->
    <div class="ai-header">
      <h3 class="ai-title">{{ t('ai.title') }}</h3>
      <div class="ai-actions">
        <button class="icon-btn" @click="createNewChat" :title="t('ai.newChat')">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button class="icon-btn" @click="showSettings = !showSettings" :title="t('ai.settings')">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 设置面板 -->
    <div v-if="showSettings" class="settings-panel">
      <div class="setting-group">
        <label class="setting-label">{{ t('ai.apiKey') }}</label>
        <input 
          type="password"
          v-model="apiKey"
          class="setting-input"
          :placeholder="t('ai.apiKeyPlaceholder')"
        />
      </div>
      <div class="setting-group">
        <label class="setting-label">{{ t('ai.model') }}</label>
        <select v-model="model" class="setting-select">
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
        </select>
      </div>
      <div class="setting-actions">
        <AppButton variant="primary" size="sm" @click="saveSettings">
          {{ t('common.save') }}
        </AppButton>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="messages-container" ref="messagesContainer">
      <div v-if="!aiStore.isEnabled" class="setup-prompt">
        <div class="setup-icon">🤖</div>
        <h4>{{ t('ai.setupRequired') }}</h4>
        <p>{{ t('ai.setupDescription') }}</p>
        <AppButton variant="primary" size="sm" @click="showSettings = true">
          {{ t('ai.configure') }}
        </AppButton>
      </div>
      
      <div v-else-if="messages.length === 0" class="empty-chat">
        <div class="empty-icon">💬</div>
        <h4>{{ t('ai.startConversation') }}</h4>
        <p>{{ t('ai.startDescription') }}</p>
      </div>
      
      <div v-else class="messages-list">
        <div 
          v-for="message in messages" 
          :key="message.id"
          class="message"
          :class="message.role"
        >
          <div class="message-avatar">
            {{ message.role === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="message-content">
            <div class="message-text">{{ message.content }}</div>
            <div class="message-time">
              {{ formatTime(message.timestamp) }}
            </div>
          </div>
        </div>
        
        <!-- 流式输出中 -->
        <div v-if="aiStore.isStreaming" class="message assistant streaming">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            <div class="message-text">
              {{ aiStore.streamingContent }}
              <span class="cursor">▌</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-container">
      <div class="input-wrapper">
        <textarea
          v-model="inputText"
          class="chat-input"
          :placeholder="t('ai.inputPlaceholder')"
          :disabled="!aiStore.isEnabled || aiStore.isLoading || aiStore.isStreaming"
          @keydown.enter.exact.prevent="sendMessage"
          @keydown.shift.enter="insertNewline"
          rows="1"
          ref="inputRef"
        ></textarea>
        <button 
          class="send-btn"
          :disabled="!canSend"
          @click="sendMessage"
        >
          <svg v-if="!aiStore.isLoading && !aiStore.isStreaming" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
          <svg v-else class="icon spinning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-linecap="round" />
          </svg>
        </button>
      </div>
      <div v-if="aiStore.isStreaming" class="streaming-controls">
        <AppButton variant="secondary" size="sm" @click="cancelStream">
          {{ t('ai.stopGenerating') }}
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAIStore } from '@renderer/stores/ai';
import AppButton from '@renderer/components/common/AppButton.vue';

const { t } = useI18n();
const aiStore = useAIStore();

// 响应式数据
const inputText = ref('');
const showSettings = ref(false);
const apiKey = ref('');
const model = ref('gpt-3.5-turbo');
const messagesContainer = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLTextAreaElement | null>(null);

// 计算属性
const messages = computed(() => aiStore.messages);
const canSend = computed(() => 
  inputText.value.trim() && 
  aiStore.isEnabled && 
  !aiStore.isLoading && 
  !aiStore.isStreaming
);

// 初始化
onMounted(async () => {
  await aiStore.initialize();
  if (aiStore.llmConfig) {
    model.value = aiStore.llmConfig.model || 'gpt-3.5-turbo';
  }
});

// 监听消息变化，自动滚动到底部
watch(messages, () => {
  nextTick(() => {
    scrollToBottom();
  });
}, { deep: true });

// 滚动到底部
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

// 发送消息
async function sendMessage() {
  if (!canSend.value) return;
  
  const text = inputText.value.trim();
  inputText.value = '';
  
  // 使用流式输出
  await aiStore.sendMessageStream(text);
}

// 插入换行
function insertNewline(e: KeyboardEvent) {
  inputText.value += '\n';
}

// 取消流式输出
async function cancelStream() {
  await aiStore.cancelStream();
}

// 创建新对话
function createNewChat() {
  aiStore.createSession();
}

// 保存设置
async function saveSettings() {
  await aiStore.saveConfig({
    provider: 'openai',
    apiKey: apiKey.value,
    model: model.value,
    temperature: 0.7,
    maxTokens: 2048,
  });
  showSettings.value = false;
}

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}
</script>

<style scoped>
.ai-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--theme-sidebar-background);
}

/* 头部 */
.ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid var(--theme-border);
}

.ai-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-text);
  margin: 0;
}

.ai-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--theme-text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: var(--theme-background-hover);
  color: var(--theme-text);
}

.icon {
  width: 16px;
  height: 16px;
}

/* 设置面板 */
.settings-panel {
  padding: 16px;
  background: var(--theme-background-secondary);
  border-bottom: 1px solid var(--theme-border);
}

.setting-group {
  margin-bottom: 12px;
}

.setting-label {
  display: block;
  font-size: 12px;
  color: var(--theme-text-secondary);
  margin-bottom: 4px;
}

.setting-input,
.setting-select {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid var(--theme-border);
  border-radius: var(--radius-sm);
  background: var(--theme-background);
  color: var(--theme-text);
}

.setting-input:focus,
.setting-select:focus {
  outline: none;
  border-color: var(--theme-primary);
}

.setting-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* 消息容器 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

/* 设置提示 */
.setup-prompt,
.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 24px;
}

.setup-icon,
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.setup-prompt h4,
.empty-chat h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-text);
  margin: 0 0 8px 0;
}

.setup-prompt p,
.empty-chat p {
  font-size: 12px;
  color: var(--theme-text-secondary);
  margin: 0 0 16px 0;
  line-height: 1.5;
}

/* 消息列表 */
.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 12px;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  background: var(--theme-background-secondary);
  border-radius: var(--radius-full);
  border: 1px solid var(--theme-border-light);
}

.message-content {
  max-width: 85%;
}

.message-text {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow: var(--shadow-sm);
}

.message.user .message-text {
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
  border-bottom-right-radius: 4px;
}

.message.assistant .message-text {
  background: var(--theme-background-secondary);
  color: var(--theme-text);
  border-bottom-left-radius: 4px;
  border: 1px solid var(--theme-border-light);
}

.message-time {
  font-size: 10px;
  color: var(--theme-text-muted);
  margin-top: 4px;
  padding: 0 4px;
}

.message.user .message-time {
  text-align: right;
}

/* 流式输出光标 */
.cursor {
  animation: blink 1s infinite;
  color: var(--theme-primary);
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 输入区域 */
.input-container {
  padding: 10px;
  border-top: 1px solid var(--theme-border);
  background: var(--theme-sidebar-background);
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  padding: 10px 14px;
  font-size: 13px;
  border: 1px solid var(--theme-border);
  border-radius: var(--radius-md);
  background: var(--theme-background-secondary);
  color: var(--theme-text);
  resize: none;
  max-height: 120px;
  line-height: 1.5;
  transition: border-color 0.2s;
  font-family: inherit;
}

.chat-input:focus {
  outline: none;
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-primary) 10%, transparent);
}

.chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: var(--theme-primary-hover);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--theme-background-secondary);
  color: var(--theme-text-muted);
}

.send-btn .icon {
  width: 18px;
  height: 18px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.streaming-controls {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}
</style>
