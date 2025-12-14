/**
 * Plugin Sandbox Worker
 * Executes plugin algorithms in an isolated Worker Thread context
 * 
 * Security model:
 * - Plugin code runs in a separate V8 context (Worker Thread)
 * - No direct access to main process APIs (fs, child_process, etc.)
 * - Communication only via structured messages
 * - Algorithm functions are serialized and executed in isolation
 */

import { parentPort, workerData } from 'worker_threads';
import * as vm from 'vm';

interface WorkerMessage {
  type: 'execute' | 'terminate';
  id: string;
  payload?: any;
}

interface ExecutePayload {
  algorithmCode: string;
  algorithmType: 'review' | 'diff';
  functionName: string;
  args: any[];
}

interface WorkerResponse {
  type: 'result' | 'error' | 'ready';
  id: string;
  data?: any;
  error?: string;
}

// Safe global context for plugin execution
const createSafeContext = () => {
  return {
    // Basic JavaScript globals (safe subset)
    console: {
      log: (...args: any[]) => sendLog('log', args),
      warn: (...args: any[]) => sendLog('warn', args),
      error: (...args: any[]) => sendLog('error', args),
    },
    Math,
    Date,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Map,
    Set,
    Promise,
    setTimeout: (fn: Function, ms: number) => {
      // Limited timeout - max 5 seconds
      if (ms > 5000) ms = 5000;
      return setTimeout(fn, ms);
    },
    clearTimeout,
    // Explicitly blocked
    require: undefined,
    process: undefined,
    Buffer: undefined,
    __dirname: undefined,
    __filename: undefined,
    global: undefined,
    globalThis: undefined,
  };
};

function sendLog(level: string, args: any[]) {
  parentPort?.postMessage({
    type: 'log',
    id: '',
    data: { level, args: args.map(a => String(a)) },
  });
}

function sendResponse(response: WorkerResponse) {
  parentPort?.postMessage(response);
}

/**
 * Execute algorithm code in sandbox
 */
function executeAlgorithm(payload: ExecutePayload): any {
  const { algorithmCode, algorithmType, functionName, args } = payload;

  // Create isolated context
  const context = vm.createContext(createSafeContext());

  try {
    // Wrap code to export the algorithm function
    const wrappedCode = `
      ${algorithmCode}
      
      // Try to find the exported algorithm
      let __algorithm__;
      if (typeof module !== 'undefined' && module.exports) {
        __algorithm__ = module.exports;
      } else if (typeof exports !== 'undefined') {
        __algorithm__ = exports;
      } else if (typeof ${functionName} !== 'undefined') {
        __algorithm__ = ${functionName};
      }
      __algorithm__;
    `;

    // Add module/exports simulation
    context.module = { exports: {} };
    context.exports = context.module.exports;

    // Execute with timeout (5 second limit)
    const script = new vm.Script(wrappedCode, {
      filename: 'plugin-algorithm.js',
    });

    const algorithm = script.runInContext(context, { timeout: 5000 });

    if (!algorithm) {
      throw new Error('Algorithm not found in plugin code');
    }

    // Execute the appropriate function based on algorithm type
    if (algorithmType === 'review') {
      if (typeof algorithm.calculate !== 'function') {
        throw new Error('Review algorithm must have a calculate() function');
      }
      return algorithm.calculate(...args);
    } else if (algorithmType === 'diff') {
      if (typeof algorithm.diff !== 'function') {
        throw new Error('Diff algorithm must have a diff() function');
      }
      return algorithm.diff(...args);
    }

    throw new Error(`Unknown algorithm type: ${algorithmType}`);
  } catch (error) {
    throw new Error(`Sandbox execution error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Message handler
parentPort?.on('message', (message: WorkerMessage) => {
  switch (message.type) {
    case 'execute':
      try {
        const result = executeAlgorithm(message.payload as ExecutePayload);
        sendResponse({
          type: 'result',
          id: message.id,
          data: result,
        });
      } catch (error) {
        sendResponse({
          type: 'error',
          id: message.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      break;

    case 'terminate':
      process.exit(0);
      break;
  }
});

// Signal ready
sendResponse({ type: 'ready', id: 'init' });
