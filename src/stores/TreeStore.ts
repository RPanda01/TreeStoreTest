import { TreeItem } from '../types';

export class TreeStore {
  private items: TreeItem[];
  private itemMap: Map<string | number, TreeItem>;

  constructor(items: TreeItem[]) {
    this.items = items;
    this.itemMap = new Map();
    items.forEach(item => this.itemMap.set(item.id, item));
  }

  getAll() {
    return this.items;
  }

  getItem(id: string | number) {
    return this.itemMap.get(id);
  }

  getChildren(id: string | number) {
    return this.items.filter(item => item.parent === id);
  }

  getAllChildren(id: string | number): TreeItem[] {
    const result: TreeItem[] = [];
    const stack = [id];
    while (stack.length) {
      const currentId = stack.pop();
      const children = this.getChildren(currentId!);
      result.push(...children);
      stack.push(...children.map(c => c.id));
    }
    return result;
  }

  getAllParents(id: string | number): TreeItem[] {
    const result: TreeItem[] = [];
    let current = this.getItem(id);
    
    if (current) {
      result.push(current);
    }
    
    while (current && current.parent !== null) {
      const parent = this.getItem(current.parent);
      if (parent) {
        result.push(parent);
        current = parent;
      } else {
        break;
      }
    }
    
    return result;
  }

  addItem(item: TreeItem) {
    this.items.push(item);
    this.itemMap.set(item.id, item);
  }

  removeItem(id: string | number) {
    const allToRemove = [id, ...this.getAllChildren(id).map(i => i.id)];
    this.items = this.items.filter(item => !allToRemove.includes(item.id));
    allToRemove.forEach(i => this.itemMap.delete(i));
  }

  updateItem(updatedItem: TreeItem) {
    const index = this.items.findIndex(i => i.id === updatedItem.id);
    if (index !== -1) {
      this.items[index] = updatedItem;
      this.itemMap.set(updatedItem.id, updatedItem);
    }
  }

  buildTree(): TreeItem[] {
    const rootItems = this.items.filter(item => item.parent === null);
    
    const buildChildren = (parentId: string | number): TreeItem[] => {
      return this.getChildren(parentId).map(child => ({
        ...child,
        children: buildChildren(child.id)
      }));
    };

    return rootItems.map(root => ({
      ...root,
      children: buildChildren(root.id)
    }));
  }

  toggleExpanded(id: string | number) {
    const item = this.getItem(id);
    if (item) {
      const updatedItem = { ...item, expanded: !item.expanded };
      this.updateItem(updatedItem);
    }
  }

  getSnapshot(): TreeItem[] {
    return JSON.parse(JSON.stringify(this.items));
  }

  restoreFromSnapshot(snapshot: TreeItem[]) {
    this.items = JSON.parse(JSON.stringify(snapshot));
    this.itemMap.clear();
    this.items.forEach(item => this.itemMap.set(item.id, item));
  }
}