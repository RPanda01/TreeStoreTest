<template>
  <div class="tree-table-container">
    <div class="toolbar">
      <span class="mode-text">Режим: {{ isEditMode ? 'редактирование' : 'просмотр' }}</span>
      <button @click="toggleEditMode">{{ isEditMode ? 'Выйти из редактирования' : 'Редактировать' }}</button>
      <button @click="undo" :disabled="historyIndex <= 0">↩ Отменить</button>
      <button @click="redo" :disabled="historyIndex >= history.length - 1">↪ Повторить</button>
    </div>
    <ag-grid-vue
      class="ag-theme-alpine"
      style="height: 600px; width: 100%;"
      :rowData="flattenedData"
      :columnDefs="columnDefs"
      :animateRows="true"
      :suppressRowClickSelection="true"
      @cellClicked="onCellClicked"
      :key="isEditMode.toString()"
    />
  </div>
</template>

<script lang="ts">
import '../assets/treeTable.css';
import { defineComponent, ref, computed } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { TreeStore } from '../stores/TreeStore';
import { TreeItem } from '../types';

ModuleRegistry.registerModules([AllCommunityModule]);

export default defineComponent({
  name: 'TreeTable',
  components: { AgGridVue },
  setup() {
    const initialData: TreeItem[] = [
      { id: 1, label: 'Айтем 1', parent: null, expanded: true },
      { id: 2, label: 'Айтем 2', parent: 1, expanded: true },
      { id: 3, label: 'Айтем 3', parent: 1, expanded: false },
      { id: 4, label: 'Айтем 4', parent: 2, expanded: true },
      { id: 5, label: 'Айтем 5', parent: 2, expanded: false },
      { id: 6, label: 'Айтем 6', parent: 2, expanded: false },
      { id: 7, label: 'Айтем 7', parent: 4, expanded: false },
      { id: 8, label: 'Айтем 8', parent: 4, expanded: false }
    ];

    const treeStore = new TreeStore(initialData);
    const isEditMode = ref(false);
    const history = ref<TreeItem[][]>([treeStore.getSnapshot()]);
    const historyIndex = ref(0);
    const refreshKey = ref(0); 

    const saveHistory = () => {
      const currentSnapshot = treeStore.getSnapshot();
      
      if (historyIndex.value < history.value.length - 1) {
        history.value = history.value.slice(0, historyIndex.value + 1);
      }
      
      const lastSnapshot = history.value[history.value.length - 1];
      if (JSON.stringify(currentSnapshot) !== JSON.stringify(lastSnapshot)) {
        history.value.push(currentSnapshot);
        historyIndex.value = history.value.length - 1;
      }
    };

    const undo = () => {
      if (historyIndex.value > 0) {
        historyIndex.value--;
        treeStore.restoreFromSnapshot(history.value[historyIndex.value]);
        refreshKey.value++;
      }
    };

    const redo = () => {
      if (historyIndex.value < history.value.length - 1) {
        historyIndex.value++;
        treeStore.restoreFromSnapshot(history.value[historyIndex.value]);
        refreshKey.value++;
      }
    };

    const flattenTree = (items: TreeItem[], level = 0): any[] => {
      const result: any[] = [];
      
      const rootItems = level === 0 
        ? items.filter(item => item.parent === null)
        : items;

      rootItems.forEach(item => {
        const children = treeStore.getChildren(item.id);
        const hasChildren = children.length > 0;
        
        result.push({
          id: item.id,
          label: item.label,
          level,
          hasChildren,
          expanded: item.expanded,
          category: hasChildren ? 'Группа' : 'Элемент'
        });

        if (item.expanded && hasChildren) {
          result.push(...flattenTree(children, level + 1));
        }
      });
      
      return result;
    };

    const flattenedData = computed(() => {
      refreshKey.value;
      return flattenTree(treeStore.getAll()).map((item, index) => ({
        ...item,
        rowNumber: index + 1
      }));
    });

    const columnDefs = computed(() => [
      {
        field: 'rowNumber',
        headerName: '№ п/п',
        width: 80,
        cellClass: 'border-right'
      },
      {
        field: 'category',
        headerName: 'Категория',
        width: 150,
        cellRenderer: (params: any) => {
          const indent = '&nbsp;&nbsp;'.repeat(params.data.level * 2);
          const icon = params.data.hasChildren
            ? params.data.expanded
              ? '<span class="expand-icon">▼</span>'
              : '<span class="expand-icon">▶</span>'
            : '';
          return `${indent}${icon} ${params.data.category}`;
        },
        cellClass: 'border-right'
      },
      {
        field: 'label',
        headerName: 'Наименование',
        flex: 1,
        minWidth: 200,
        cellRenderer: (params: any) => {
          let buttons = '';
          if (isEditMode.value) {
            buttons = `
              <button class="action-btn add-btn" title="Добавить">+</button>
              <button class="action-btn delete-btn" title="Удалить">×</button>
            `;
          }
          const isGroup = params.data.hasChildren;
          const labelClass = isGroup ? 'item-label group-label' : 'item-label';
          return `${buttons} <span class="${labelClass}">${params.value}</span>`;
        }
      }
    ]);

    const toggleNode = (id: number | string) => {
      treeStore.toggleExpanded(id);
      refreshKey.value++;
    };

    const addChild = (parentId: number | string) => {
      saveHistory();
      
      const newItem: TreeItem = {
        id: Date.now(),
        label: 'Новый элемент',
        parent: parentId,
        expanded: false
      };
      
      treeStore.addItem(newItem);
      
      const parent = treeStore.getItem(parentId);
      if (parent && !parent.expanded) {
        treeStore.toggleExpanded(parentId);
      }
      
      const newSnapshot = treeStore.getSnapshot();
      history.value.push(newSnapshot);
      historyIndex.value = history.value.length - 1;
      
      refreshKey.value++;
    };

    const removeNode = (id: number | string) => {
      saveHistory();
      treeStore.removeItem(id);
      const newSnapshot = treeStore.getSnapshot();
      history.value.push(newSnapshot);
      historyIndex.value = history.value.length - 1;
      
      refreshKey.value++;
    };

    const editNodeLabel = (id: number | string, currentLabel: string) => {
      const newLabel = prompt('Введите новое название:', currentLabel);
      if (newLabel !== null && newLabel !== currentLabel) {
        saveHistory();
        
        const item = treeStore.getItem(id);
        if (item) {
          const updatedItem = { ...item, label: newLabel };
          treeStore.updateItem(updatedItem);
          const newSnapshot = treeStore.getSnapshot();
          history.value.push(newSnapshot);
          historyIndex.value = history.value.length - 1;
          
          refreshKey.value++;
        }
      }
    };

    const toggleEditMode = () => {
      isEditMode.value = !isEditMode.value;
    };

    const onCellClicked = (event: any) => {
      if (event.colDef.field === 'category' && event.data.hasChildren) {
        toggleNode(event.data.id);
      } else if (event.colDef.field === 'label') {
        if (isEditMode.value) {
          if (event.event.target.classList.contains('add-btn')) {
            addChild(event.data.id);
          } else if (event.event.target.classList.contains('delete-btn')) {
            removeNode(event.data.id);
          } else if (!event.event.target.classList.contains('action-btn')) {
            editNodeLabel(event.data.id, event.data.label);
          }
        }
      }
    };

    return {
      flattenedData,
      columnDefs,
      undo,
      redo,
      toggleEditMode,
      isEditMode,
      onCellClicked,
      history,
      historyIndex
    };
  }
});
</script>