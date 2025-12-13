/**
 * Sample Sidebar Plugin
 * A demo plugin that adds a custom sidebar view to MemoryNote
 */

class SampleSidebarPlugin {
  constructor() {
    this.context = null;
    this.sidebarElement = null;
    this.items = [];
  }

  /**
   * Activate the plugin
   * @param {PluginContext} context - The plugin context
   */
  async activate(context) {
    this.context = context;
    console.log('[SampleSidebarPlugin] Activating...');

    // Load saved items from storage
    const savedItems = context.globalState.get('items');
    if (savedItems) {
      this.items = savedItems;
    }

    // Register commands
    this.registerCommands();

    // Create sidebar content
    this.createSidebarContent();

    console.log('[SampleSidebarPlugin] Activated successfully!');
  }

  /**
   * Deactivate the plugin
   */
  async deactivate() {
    console.log('[SampleSidebarPlugin] Deactivating...');
    
    // Save items to storage
    if (this.context) {
      await this.context.globalState.set('items', this.items);
    }

    // Clean up
    this.sidebarElement = null;
    this.context = null;
    
    console.log('[SampleSidebarPlugin] Deactivated');
  }

  /**
   * Register plugin commands
   */
  registerCommands() {
    // These commands are declared in manifest.json
    // The app will handle command registration based on the manifest
  }

  /**
   * Create the sidebar content
   */
  createSidebarContent() {
    // This method creates the sidebar view structure
    // The actual rendering will be handled by the plugin system
    this.sidebarContent = {
      title: 'Sample Sidebar',
      icon: '📊',
      render: () => this.renderSidebar()
    };
  }

  /**
   * Render the sidebar HTML
   */
  renderSidebar() {
    const timestamp = new Date().toLocaleTimeString();
    
    return `
      <div class="sample-sidebar">
        <div class="sample-sidebar-header">
          <h3>📊 Sample Plugin</h3>
          <span class="timestamp">${timestamp}</span>
        </div>
        
        <div class="sample-sidebar-content">
          <p class="greeting">Hello from Sample Plugin!</p>
          
          <div class="sample-actions">
            <button class="sample-btn" onclick="samplePlugin.addItem()">
              ➕ Add Item
            </button>
            <button class="sample-btn secondary" onclick="samplePlugin.clearItems()">
              🗑️ Clear All
            </button>
          </div>
          
          <div class="sample-list">
            <h4>Items (${this.items.length})</h4>
            <ul>
              ${this.items.map((item, index) => `
                <li class="sample-item">
                  <span class="item-content">${item.text}</span>
                  <span class="item-time">${item.time}</span>
                  <button class="item-remove" onclick="samplePlugin.removeItem(${index})">×</button>
                </li>
              `).join('')}
            </ul>
            ${this.items.length === 0 ? '<p class="empty-message">No items yet. Click "Add Item" to add one!</p>' : ''}
          </div>
        </div>
        
        <div class="sample-sidebar-footer">
          <small>Sample Sidebar Plugin v1.0.0</small>
        </div>
      </div>
    `;
  }

  /**
   * Add a new item
   */
  async addItem() {
    const newItem = {
      id: Date.now(),
      text: `Item ${this.items.length + 1}`,
      time: new Date().toLocaleTimeString()
    };
    
    this.items.push(newItem);
    
    // Save to storage
    if (this.context) {
      await this.context.globalState.set('items', this.items);
    }
    
    // Trigger re-render
    this.notifyUpdate();
  }

  /**
   * Remove an item by index
   */
  async removeItem(index) {
    this.items.splice(index, 1);
    
    // Save to storage
    if (this.context) {
      await this.context.globalState.set('items', this.items);
    }
    
    // Trigger re-render
    this.notifyUpdate();
  }

  /**
   * Clear all items
   */
  async clearItems() {
    this.items = [];
    
    // Save to storage
    if (this.context) {
      await this.context.globalState.set('items', this.items);
    }
    
    // Trigger re-render
    this.notifyUpdate();
  }

  /**
   * Notify the plugin system of updates
   */
  notifyUpdate() {
    // The plugin system will handle updates
    if (this.onUpdate) {
      this.onUpdate();
    }
  }

  /**
   * Say hello command handler
   */
  sayHello() {
    console.log('Hello from Sample Sidebar Plugin!');
    return 'Hello from Sample Sidebar Plugin!';
  }

  /**
   * Get sidebar view configuration
   */
  getView() {
    return {
      id: 'sample-sidebar-view',
      title: 'Sample View',
      icon: '📊',
      location: 'sidebar-left',
      render: () => this.renderSidebar(),
      actions: {
        addItem: () => this.addItem(),
        removeItem: (index) => this.removeItem(index),
        clearItems: () => this.clearItems()
      }
    };
  }
}

// Export plugin instance
const plugin = new SampleSidebarPlugin();

// Make it available globally for command handlers
if (typeof window !== 'undefined') {
  window.samplePlugin = plugin;
}

module.exports = plugin;
