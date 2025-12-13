# FSRS Algorithm Plugin for MemoryNote

This plugin provides advanced spaced repetition algorithms for MemoryNote.

## Included Algorithms

### FSRS (Free Spaced Repetition Scheduler)

FSRS is a modern, optimized spaced repetition algorithm that outperforms traditional algorithms like SM-2 and Anki's algorithm. It uses a more sophisticated model to predict memory retention and optimize review scheduling.

**Features:**
- Adaptive difficulty tracking
- Stability-based interval calculation
- Configurable target retention
- Better handling of lapses

**Reference:** [FSRS4Anki](https://github.com/open-spaced-repetition/fsrs4anki)

### Semantic Diff

A diff algorithm that is aware of word boundaries and provides more meaningful change detection for natural language text.

**Features:**
- Word-boundary aware tokenization
- Longest Common Subsequence (LCS) based comparison
- Groups consecutive changes together
- Preserves semantic meaning of changes

## Installation

1. Download the ZIP file
2. In MemoryNote, go to Settings > Plugins
3. Click "Install from ZIP" and select the downloaded file
4. Enable the plugin

## Usage

After installation, go to Settings > Review to select the FSRS algorithm or Semantic Diff algorithm.

## License

MIT License
