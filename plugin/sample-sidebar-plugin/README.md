# Sample Sidebar Plugin

A demonstration plugin for MemoryNote that shows how to create a custom sidebar view.

## Features

- **Custom Sidebar View**: Adds a new sidebar panel to the left sidebar
- **Item Management**: Add, remove, and clear items with persistent storage
- **Commands**: Register custom commands accessible via the command palette
- **Configuration**: Customizable settings through the plugin configuration

## Installation

1. Compress this folder into a ZIP file
2. Open MemoryNote
3. Go to Settings → Plugins
4. Click "Install from ZIP"
5. Select the ZIP file

## Usage

Once installed and enabled, you'll see a new "Sample View" option in the left sidebar. Click on it to open the sample sidebar panel.

### Available Commands

| Command | Description |
|---------|-------------|
| `Sample Sidebar: Say Hello` | Display a hello message |
| `Sample Sidebar: Toggle View` | Toggle the sample sidebar visibility |

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sampleSidebar.greeting` | string | "Hello from Sample Plugin!" | The greeting message |
| `sampleSidebar.showTimestamp` | boolean | true | Show timestamps |

## Development

### File Structure

```
sample-sidebar-plugin/
├── manifest.json     # Plugin manifest
├── index.js          # Main plugin entry
├── styles.css        # Plugin styles
└── README.md         # Documentation
```

### Plugin API

The plugin uses the standard MemoryNote plugin API:

```javascript
module.exports = {
  activate(context) {
    // Called when plugin is activated
    // context.extensionPath - plugin directory path
    // context.globalState - persistent storage
    // context.workspaceState - workspace storage
  },
  
  deactivate() {
    // Called when plugin is deactivated
    // Clean up resources here
  }
};
```

## License

MIT License
