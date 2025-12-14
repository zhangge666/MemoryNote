/**
 * Embedding 提供商工厂
 * 根据配置创建对应的提供商实例
 */

import type {
  EmbeddingConfig,
  EmbeddingProvider,
  IEmbeddingProvider,
} from '../../../shared/types/ai';
import { EMBEDDING_PROVIDER_DEFAULTS } from '../../../shared/types/ai';
import { LocalEmbeddingProvider } from './LocalEmbeddingProvider';
import { OpenAIEmbeddingProvider } from './OpenAIEmbeddingProvider';
import { QwenEmbeddingProvider } from './QwenEmbeddingProvider';

/**
 * 创建 Embedding 提供商实例
 */
export async function createEmbeddingProvider(config: EmbeddingConfig): Promise<IEmbeddingProvider> {
  switch (config.provider) {
    case 'local':
      // 动态导入 LocalEmbeddingProvider 以避免打包问题
      const { LocalEmbeddingProvider } = await import('./LocalEmbeddingProvider');
      return new LocalEmbeddingProvider(config);
    
    case 'openai':
      return new OpenAIEmbeddingProvider(config);
    
    case 'qwen':
      return new QwenEmbeddingProvider(config);
    
    case 'custom':
      // 自定义提供商使用 OpenAI 兼容 API 格式
      return new OpenAIEmbeddingProvider(config);
    
    default:
      console.warn(`Unknown embedding provider: ${config.provider}, falling back to local`);
      // 动态导入 LocalEmbeddingProvider 以避免打包问题
      const { LocalEmbeddingProvider: FallbackLocalEmbeddingProvider } = await import('./LocalEmbeddingProvider');
      return new FallbackLocalEmbeddingProvider({
        ...EMBEDDING_PROVIDER_DEFAULTS.local,
        ...config,
      });
  }
}

/**
 * 获取提供商的默认配置
 */
export function getProviderDefaults(provider: EmbeddingProvider): Omit<EmbeddingConfig, 'apiKey'> {
  return EMBEDDING_PROVIDER_DEFAULTS[provider] || EMBEDDING_PROVIDER_DEFAULTS.local;
}

/**
 * 验证 Embedding 配置
 */
export function validateEmbeddingConfig(config: EmbeddingConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查必填字段
  if (!config.provider) {
    errors.push('Provider is required');
  }

  if (!config.model) {
    errors.push('Model is required');
  }

  // API 提供商需要 API 密钥
  if (config.provider !== 'local' && !config.apiKey) {
    errors.push(`API key is required for ${config.provider} provider`);
  }

  // 自定义提供商需要端点
  if (config.provider === 'custom' && !config.apiEndpoint) {
    errors.push('API endpoint is required for custom provider');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 获取支持的提供商列表
 */
export function getSupportedProviders(): Array<{
  id: EmbeddingProvider;
  name: string;
  description: string;
  requiresApiKey: boolean;
}> {
  return [
    {
      id: 'local',
      name: 'Local (Transformers.js)',
      description: '本地运行，无需 API 密钥，支持离线使用',
      requiresApiKey: false,
    },
    {
      id: 'openai',
      name: 'OpenAI',
      description: '使用 OpenAI Embeddings API (text-embedding-3-small/large)',
      requiresApiKey: true,
    },
    {
      id: 'qwen',
      name: '通义千问 (Qwen)',
      description: '使用阿里云 DashScope API (text-embedding-v3)',
      requiresApiKey: true,
    },
    {
      id: 'custom',
      name: '自定义',
      description: '使用自定义 API 端点（需兼容 OpenAI 格式）',
      requiresApiKey: true,
    },
  ];
}
