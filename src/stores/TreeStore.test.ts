import { describe, it, expect, beforeEach } from 'vitest';
import { TreeStore } from './TreeStore';
import { TreeItem } from '../types';

describe('TreeStore', () => {
  let store: TreeStore;
  let items: TreeItem[];

  beforeEach(() => {
    items = [
      { id: 1, parent: null, label: 'Айтем 1' },
      { id: '2', parent: 1, label: 'Айтем 2' },
      { id: 3, parent: 1, label: 'Айтем 3' },
      { id: 4, parent: '2', label: 'Айтем 4' },
      { id: 5, parent: '2', label: 'Айтем 5' },
      { id: 6, parent: '2', label: 'Айтем 6' },
      { id: 7, parent: 4, label: 'Айтем 7' },
      { id: 8, parent: 4, label: 'Айтем 8' }
    ];
    store = new TreeStore(items);
  });

  describe('getAll', () => {
    it('should return all items', () => {
      expect(store.getAll()).toEqual(items);
      expect(store.getAll().length).toBe(8);
    });
  });

  describe('getItem', () => {
    it('should return item by id', () => {
      expect(store.getItem(1)).toEqual({ id: 1, parent: null, label: 'Айтем 1' });
      expect(store.getItem('2')).toEqual({ id: '2', parent: 1, label: 'Айтем 2' });
    });

    it('should return undefined for non-existent id', () => {
      expect(store.getItem(999)).toBeUndefined();
    });
  });

  describe('getChildren', () => {
    it('should return direct children', () => {
      const children = store.getChildren(1);
      expect(children).toHaveLength(2);
      expect(children.map(c => c.id)).toEqual(['2', 3]);
    });

    it('should return empty array for leaf nodes', () => {
      expect(store.getChildren(3)).toEqual([]);
    });

    it('should return empty array for non-existent id', () => {
      expect(store.getChildren(999)).toEqual([]);
    });

    it('should return children of node 2', () => {
      const children = store.getChildren('2');
      expect(children).toHaveLength(3);
      expect(children.map(c => c.id)).toEqual([4, 5, 6]);
    });

    it('should return children of node 4', () => {
      const children = store.getChildren(4);
      expect(children).toHaveLength(2);
      expect(children.map(c => c.id)).toEqual([7, 8]);
    });
  });

  describe('getAllChildren', () => {
    it('should return all descendants of root node', () => {
      const allChildren = store.getAllChildren(1);
      expect(allChildren).toHaveLength(7); // все кроме корневого
      // Порядок может варьироваться, поэтому проверяем содержимое
      const childIds = allChildren.map(c => c.id).sort();
      expect(childIds).toEqual(['2', 3, 4, 5, 6, 7, 8]);
    });

    it('should return children recursively for node 2', () => {
      const children = store.getAllChildren('2');
      expect(children).toHaveLength(5);
      const childIds = children.map(c => c.id).sort();
      expect(childIds).toEqual([4, 5, 6, 7, 8]);
    });

    it('should return children recursively for node 4', () => {
      const children = store.getAllChildren(4);
      expect(children).toHaveLength(2);
      const childIds = children.map(c => c.id).sort();
      expect(childIds).toEqual([7, 8]);
    });

    it('should return empty array for leaf nodes', () => {
      expect(store.getAllChildren(3)).toEqual([]);
      expect(store.getAllChildren(7)).toEqual([]);
      expect(store.getAllChildren(8)).toEqual([]);
    });
  });

  describe('getAllParents', () => {
    it('should return path to root including the item itself', () => {
      const parents = store.getAllParents(7);
      expect(parents).toHaveLength(4);
      expect(parents.map(p => p.id)).toEqual([7, 4, '2', 1]);
    });

    it('should return only the item for root nodes', () => {
      const parents = store.getAllParents(1);
      expect(parents).toHaveLength(1);
      expect(parents[0].id).toBe(1);
    });

    it('should handle direct children of root', () => {
      const parents = store.getAllParents('2');
      expect(parents).toHaveLength(2);
      expect(parents.map(p => p.id)).toEqual(['2', 1]);
    });

    it('should handle three-level deep nodes', () => {
      const parents = store.getAllParents(8);
      expect(parents).toHaveLength(4);
      expect(parents.map(p => p.id)).toEqual([8, 4, '2', 1]);
    });

    it('should handle second-level leaf nodes', () => {
      const parents = store.getAllParents(3);
      expect(parents).toHaveLength(2);
      expect(parents.map(p => p.id)).toEqual([3, 1]);
    });

    it('should return empty array for non-existent id', () => {
      const parents = store.getAllParents(999);
      expect(parents).toHaveLength(0);
    });
  });

  describe('addItem', () => {
    it('should add new item', () => {
      const newItem = { id: 9, parent: 3, label: 'Новый айтем' };
      store.addItem(newItem);
      
      expect(store.getItem(9)).toEqual(newItem);
      expect(store.getAll()).toHaveLength(9);
      expect(store.getChildren(3)).toHaveLength(1);
    });

    it('should add item to root', () => {
      const newItem = { id: 10, parent: null, label: 'Новый корневой' };
      store.addItem(newItem);
      
      expect(store.getItem(10)).toEqual(newItem);
      expect(store.getAll()).toHaveLength(9);
      expect(store.getChildren(null)).toHaveLength(2); // 1 и 10
    });
  });

  describe('removeItem', () => {
    it('should remove item and all its children', () => {
      store.removeItem('2');
      
      expect(store.getItem('2')).toBeUndefined();
      expect(store.getItem(4)).toBeUndefined();
      expect(store.getItem(5)).toBeUndefined();
      expect(store.getItem(6)).toBeUndefined();
      expect(store.getItem(7)).toBeUndefined();
      expect(store.getItem(8)).toBeUndefined();
      expect(store.getAll()).toHaveLength(2); // остается только 1 и 3
    });

    it('should remove only leaf item', () => {
      store.removeItem(3);
      
      expect(store.getItem(3)).toBeUndefined();
      expect(store.getAll()).toHaveLength(7);
      expect(store.getChildren(1)).toHaveLength(1); // только '2'
    });

    it('should remove intermediate node with children', () => {
      store.removeItem(4);
      
      expect(store.getItem(4)).toBeUndefined();
      expect(store.getItem(7)).toBeUndefined();
      expect(store.getItem(8)).toBeUndefined();
      expect(store.getAll()).toHaveLength(5); // остается 1, '2', 3, 5, 6
      expect(store.getChildren('2')).toHaveLength(2); // только 5 и 6
    });
  });

  describe('updateItem', () => {
    it('should update existing item', () => {
      const updatedItem = { id: 3, parent: 1, label: 'Обновленный айтем' };
      store.updateItem(updatedItem);
      
      expect(store.getItem(3)).toEqual(updatedItem);
    });

    it('should update item structure', () => {
      const updatedItem = { id: 3, parent: '2', label: 'Перемещенный айтем' };
      store.updateItem(updatedItem);
      
      expect(store.getItem(3)).toEqual(updatedItem);
      expect(store.getChildren(1)).toHaveLength(1); // только '2'
      expect(store.getChildren('2')).toHaveLength(4); // 4, 5, 6, 3
    });

    it('should not add new item if id does not exist', () => {
      const newItem = { id: 999, parent: 1, label: 'Несуществующий' };
      store.updateItem(newItem);
      
      expect(store.getAll()).toHaveLength(8); // размер не изменился
      expect(store.getItem(999)).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle mixed id types correctly', () => {
      expect(store.getItem(1)).toBeDefined();
      expect(store.getItem('2')).toBeDefined();
      expect(store.getChildren(1).map(c => c.id)).toEqual(['2', 3]);
      expect(store.getChildren('2').map(c => c.id)).toEqual([4, 5, 6]);
    });

    it('should handle null parent correctly', () => {
      const rootItems = store.getChildren(null);
      expect(rootItems).toHaveLength(1);
      expect(rootItems[0].id).toBe(1);
    });
  });

  describe('Performance tests', () => {
    it('should handle large datasets efficiently', () => {
      // Создаем большой набор данных
      const largeItems: TreeItem[] = [];
      for (let i = 0; i < 10000; i++) {
        largeItems.push({
          id: i,
          parent: i === 0 ? null : Math.floor(i / 10),
          label: `Item ${i}`
        });
      }

      const start = performance.now();
      const largeStore = new TreeStore(largeItems);
      const constructTime = performance.now() - start;

      expect(constructTime).toBeLessThan(100); // должно быть быстро

      // Тест операций
      const getStart = performance.now();
      largeStore.getItem(5000);
      const getTime = performance.now() - getStart;
      expect(getTime).toBeLessThan(1);

      const childrenStart = performance.now();
      largeStore.getChildren(500);
      const childrenTime = performance.now() - childrenStart;
      expect(childrenTime).toBeLessThan(10);
    });
  });
});