/**
 * Semantic Diff Algorithm Implementation
 * 
 * A diff algorithm that is aware of word boundaries and provides
 * more meaningful change detection for natural language text.
 * 
 * This algorithm:
 * 1. Tokenizes text into words and punctuation
 * 2. Uses Longest Common Subsequence (LCS) for comparison
 * 3. Groups consecutive changes together
 * 4. Preserves semantic meaning of changes
 */

/**
 * Tokenize text into words and punctuation
 * @param {string} text - Input text
 * @returns {string[]} Array of tokens
 */
function tokenize(text) {
  // Split by word boundaries, keeping punctuation as separate tokens
  return text.split(/(\s+|[.,!?;:'"()\[\]{}])/g).filter(t => t.length > 0);
}

/**
 * Compute Longest Common Subsequence matrix
 * @param {string[]} a - First token array
 * @param {string[]} b - Second token array
 * @returns {number[][]} LCS matrix
 */
function lcsMatrix(a, b) {
  const m = a.length;
  const n = b.length;
  const matrix = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }
  
  return matrix;
}

/**
 * Backtrack through LCS matrix to find differences
 * @param {string[]} oldTokens - Old text tokens
 * @param {string[]} newTokens - New text tokens
 * @param {number[][]} matrix - LCS matrix
 * @returns {Object[]} Array of diff operations
 */
function backtrack(oldTokens, newTokens, matrix) {
  const diffs = [];
  let i = oldTokens.length;
  let j = newTokens.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldTokens[i - 1] === newTokens[j - 1]) {
      // Match - no change
      i--;
      j--;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      // Addition
      diffs.unshift({ type: 'add', token: newTokens[j - 1], newIndex: j - 1 });
      j--;
    } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
      // Deletion
      diffs.unshift({ type: 'delete', token: oldTokens[i - 1], oldIndex: i - 1 });
      i--;
    }
  }
  
  return diffs;
}

/**
 * Group consecutive diffs of the same type
 * @param {Object[]} diffs - Array of diff operations
 * @returns {Object[]} Grouped diffs
 */
function groupDiffs(diffs) {
  if (diffs.length === 0) return [];
  
  const groups = [];
  let currentGroup = {
    type: diffs[0].type,
    tokens: [diffs[0].token],
    startIndex: diffs[0].type === 'add' ? diffs[0].newIndex : diffs[0].oldIndex
  };
  
  for (let i = 1; i < diffs.length; i++) {
    const diff = diffs[i];
    const prevDiff = diffs[i - 1];
    const currentIndex = diff.type === 'add' ? diff.newIndex : diff.oldIndex;
    const prevIndex = prevDiff.type === 'add' ? prevDiff.newIndex : prevDiff.oldIndex;
    
    // Group if same type and consecutive
    if (diff.type === currentGroup.type && currentIndex === prevIndex + 1) {
      currentGroup.tokens.push(diff.token);
    } else {
      groups.push(currentGroup);
      currentGroup = {
        type: diff.type,
        tokens: [diff.token],
        startIndex: currentIndex
      };
    }
  }
  
  groups.push(currentGroup);
  return groups;
}

/**
 * Convert token indices to line numbers
 * @param {string} text - Original text
 * @param {number} tokenIndex - Token index
 * @param {string[]} tokens - All tokens
 * @returns {number} Line number (1-based)
 */
function tokenToLine(text, tokenIndex, tokens) {
  let charPos = 0;
  for (let i = 0; i < tokenIndex && i < tokens.length; i++) {
    charPos += tokens[i].length;
  }
  
  const textBefore = text.substring(0, charPos);
  return textBefore.split('\n').length;
}

/**
 * Semantic Diff Algorithm Implementation
 * Implements the IDiffAlgorithm interface
 */
module.exports = {
  name: 'Semantic Diff',
  
  /**
   * Compare two texts and return semantic differences
   * @param {string} oldText - Original text
   * @param {string} newText - New text
   * @returns {Object[]} Array of DiffChange objects
   */
  diff: function(oldText, newText) {
    // Handle edge cases
    if (oldText === newText) return [];
    if (!oldText) {
      return [{
        type: 'add',
        content: newText,
        lineStart: 1,
        lineEnd: newText.split('\n').length
      }];
    }
    if (!newText) {
      return [{
        type: 'delete',
        content: oldText,
        lineStart: 1,
        lineEnd: oldText.split('\n').length
      }];
    }
    
    // Tokenize texts
    const oldTokens = tokenize(oldText);
    const newTokens = tokenize(newText);
    
    // Compute LCS and get diffs
    const matrix = lcsMatrix(oldTokens, newTokens);
    const diffs = backtrack(oldTokens, newTokens, matrix);
    
    // Group consecutive changes
    const groups = groupDiffs(diffs);
    
    // Convert to DiffChange format
    const changes = groups.map(group => {
      const content = group.tokens.join('');
      const sourceText = group.type === 'add' ? newText : oldText;
      const sourceTokens = group.type === 'add' ? newTokens : oldTokens;
      
      const lineStart = tokenToLine(sourceText, group.startIndex, sourceTokens);
      const lineEnd = tokenToLine(sourceText, group.startIndex + group.tokens.length - 1, sourceTokens);
      
      return {
        type: group.type,
        content: content.trim() || content,
        lineStart,
        lineEnd
      };
    });
    
    // Filter out whitespace-only changes
    return changes.filter(c => c.content.trim().length > 0);
  }
};
