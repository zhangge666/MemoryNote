/**
 * Plugin Executor Service
 * Manages isolated execution of plugin algorithms via Worker Threads
 * 
 * Security model:
 * - Each algorithm execution runs in a VM sandbox within a Worker
 * - No direct access to Node.js APIs from plugin code
 * - Timeout protection prevents infinite loops
 * - Message-based communication only
 */

import { Worker } from 'worker_threads';
import * as path from 'path';
import * as fs from 'fs';
import type { IReviewAlgorithm, IDiffAlgorithm, ReviewCard, ReviewResult, DiffChange } from '../../shared/types/review';

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

interface SandboxedAlgorithm {
  pluginId: string;
  algorithmId: string;
  algorithmType: 'review' | 'diff';
  code: string;
  name: string;
}

/**
 * Plugin Executor - Manages sandboxed plugin execution
 */
export class PluginExecutor {
  private static instance: PluginExecutor;
  private worker: Worker | null = null;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private requestId = 0;
  private isReady = false;
  private readyPromise: Promise<void> | null = null;
  
  // Registered sandboxed algorithms
  private sandboxedAlgorithms: Map<string, SandboxedAlgorithm> = new Map();

  private constructor() {}

  static getInstance(): PluginExecutor {
    if (!PluginExecutor.instance) {
      PluginExecutor.instance = new PluginExecutor();
    }
    return PluginExecutor.instance;
  }

  /**
   * Initialize the executor and start the worker
   */
  async initialize(): Promise<void> {
    if (this.worker) {
      return this.readyPromise || Promise.resolve();
    }

    this.readyPromise = new Promise((resolve, reject) => {
      try {
        // Worker script path - need to handle both dev and production
        const workerPath = path.join(__dirname, 'workers', 'pluginSandbox.js');
        
        // Check if compiled worker exists
        if (!fs.existsSync(workerPath)) {
          // In development, the worker might be in a different location
          console.warn('[PluginExecutor] Worker file not found at:', workerPath);
          console.warn('[PluginExecutor] Plugin isolation disabled - falling back to direct execution');
          this.isReady = true;
          resolve();
          return;
        }

        this.worker = new Worker(workerPath);

        this.worker.on('message', (message) => {
          this.handleWorkerMessage(message);
        });

        this.worker.on('error', (error) => {
          console.error('[PluginExecutor] Worker error:', error);
          this.handleWorkerError(error);
        });

        this.worker.on('exit', (code) => {
          console.log('[PluginExecutor] Worker exited with code:', code);
          this.worker = null;
          this.isReady = false;
        });

        // Wait for ready message
        const readyTimeout = setTimeout(() => {
          reject(new Error('Worker initialization timeout'));
        }, 10000);

        const onReady = (message: any) => {
          if (message.type === 'ready') {
            clearTimeout(readyTimeout);
            this.isReady = true;
            console.log('[PluginExecutor] Worker ready');
            resolve();
          }
        };

        this.worker.once('message', onReady);
      } catch (error) {
        console.error('[PluginExecutor] Failed to initialize worker:', error);
        reject(error);
      }
    });

    return this.readyPromise;
  }

  /**
   * Handle messages from worker
   */
  private handleWorkerMessage(message: any): void {
    if (message.type === 'log') {
      const { level, args } = message.data;
      console.log(`[Plugin] [${level}]`, ...args);
      return;
    }

    const pending = this.pendingRequests.get(message.id);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(message.id);

    if (message.type === 'result') {
      pending.resolve(message.data);
    } else if (message.type === 'error') {
      pending.reject(new Error(message.error));
    }
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(error: Error): void {
    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }

  /**
   * Register a plugin algorithm for sandboxed execution
   */
  registerAlgorithm(
    pluginId: string,
    algorithmId: string,
    algorithmType: 'review' | 'diff',
    codePath: string,
    name: string
  ): void {
    // Read the algorithm code
    const code = fs.readFileSync(codePath, 'utf-8');
    
    const fullId = `algo:${algorithmType}:plugin:${pluginId}:${algorithmId}`;
    this.sandboxedAlgorithms.set(fullId, {
      pluginId,
      algorithmId,
      algorithmType,
      code,
      name,
    });

    console.log(`[PluginExecutor] Registered sandboxed algorithm: ${name} (${fullId})`);
  }

  /**
   * Unregister a plugin's algorithms
   */
  unregisterPluginAlgorithms(pluginId: string): void {
    for (const [id, algo] of this.sandboxedAlgorithms) {
      if (algo.pluginId === pluginId) {
        this.sandboxedAlgorithms.delete(id);
        console.log(`[PluginExecutor] Unregistered sandboxed algorithm: ${id}`);
      }
    }
  }

  /**
   * Execute a review algorithm in the sandbox
   */
  async executeReviewAlgorithm(
    algorithmId: string,
    card: ReviewCard,
    result: ReviewResult
  ): Promise<{
    interval: number;
    difficulty: number;
    easeFactor: number;
    repetitions: number;
    nextReview: number;
  }> {
    const algo = this.sandboxedAlgorithms.get(algorithmId);
    if (!algo) {
      throw new Error(`Sandboxed algorithm not found: ${algorithmId}`);
    }

    if (!this.worker || !this.isReady) {
      throw new Error('Plugin executor not ready');
    }

    return this.sendRequest({
      algorithmCode: algo.code,
      algorithmType: 'review',
      functionName: 'calculate',
      args: [card, result],
    });
  }

  /**
   * Execute a diff algorithm in the sandbox
   */
  async executeDiffAlgorithm(
    algorithmId: string,
    oldText: string,
    newText: string
  ): Promise<DiffChange[]> {
    const algo = this.sandboxedAlgorithms.get(algorithmId);
    if (!algo) {
      throw new Error(`Sandboxed algorithm not found: ${algorithmId}`);
    }

    if (!this.worker || !this.isReady) {
      throw new Error('Plugin executor not ready');
    }

    return this.sendRequest({
      algorithmCode: algo.code,
      algorithmType: 'diff',
      functionName: 'diff',
      args: [oldText, newText],
    });
  }

  /**
   * Send request to worker and wait for response
   */
  private sendRequest(payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = `req_${++this.requestId}`;
      
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('Plugin execution timeout (5s)'));
      }, 6000); // Slightly longer than worker timeout

      this.pendingRequests.set(id, { resolve, reject, timeout });

      this.worker?.postMessage({
        type: 'execute',
        id,
        payload,
      });
    });
  }

  /**
   * Create a sandboxed review algorithm wrapper
   * Returns an IReviewAlgorithm that executes in the sandbox
   */
  createSandboxedReviewAlgorithm(algorithmId: string, name: string): IReviewAlgorithm {
    const executor = this;
    return {
      name,
      calculate: (card: ReviewCard, result: ReviewResult) => {
        return executor.executeReviewAlgorithm(algorithmId, card, result);
      },
    };
  }

  /**
   * Create a sandboxed diff algorithm wrapper
   * Returns an IDiffAlgorithm that executes in the sandbox
   */
  createSandboxedDiffAlgorithm(algorithmId: string, name: string): IDiffAlgorithm {
    const executor = this;
    return {
      name,
      diff: (oldText: string, newText: string) => {
        return executor.executeDiffAlgorithm(algorithmId, oldText, newText);
      },
    };
  }

  /**
   * Check if an algorithm is sandboxed
   */
  isSandboxed(algorithmId: string): boolean {
    return this.sandboxedAlgorithms.has(algorithmId);
  }

  /**
   * Check if executor is available
   */
  isAvailable(): boolean {
    return this.isReady;
  }

  /**
   * Terminate the worker
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      this.worker.postMessage({ type: 'terminate', id: 'shutdown' });
      await this.worker.terminate();
      this.worker = null;
      this.isReady = false;
    }
  }
}
