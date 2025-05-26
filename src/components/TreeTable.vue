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
      :key="isEditMode"
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

ModuleRegistry.registerModules([AllCommunityModule]);

interface TreeNode {
  id: number | string;
  label: string;
  parent: number | string | null;
  children?: TreeNode[];
  expanded?: boolean;
}

export default defineComponent({
  name: 'TreeTable',
  components: { AgGridVue },
  setup() {
    const treeData = ref<TreeNode[]>([
      {
        id: 1,
        label: 'Айтем 1',
        parent: null,
        expanded: true,
        children: [
          {
            id: 2,
            label: 'Айтем 2',
            parent: 1,
            expanded: true,
            children: [
              {
                id: 4,
                label: 'Айтем 4',
                parent: 2,
                expanded: true,
                children: [
                  { id: 7, label: 'Айтем 7', parent: 4 },
                  { id: 8, label: 'Айтем 8', parent: 4 }
                ]
              },
              { id: 5, label: 'Айтем 5', parent: 2 },
              { id: 6, label: 'Айтем 6', parent: 2 }
            ]
          },
          { id: 3, label: 'Айтем 3', parent: 1 }
        ]
      }
    ]);

    const isEditMode = ref(false);
    const history = ref<TreeNode[][]>([JSON.parse(JSON.stringify(treeData.value))]);
    const historyIndex = ref(0);

    const saveHistory = () => {
      // Сохраняем текущее состояние ПЕРЕД изменением
      const currentSnapshot = JSON.parse(JSON.stringify(treeData.value));
      
      // Если мы не в конце истории, обрезаем все после текущей позиции
      if (historyIndex.value < history.value.length - 1) {
        history.value = history.value.slice(0, historyIndex.value + 1);
      }
      
      // Добавляем новый снимок только если он отличается от текущего
      const lastSnapshot = history.value[history.value.length - 1];
      if (JSON.stringify(currentSnapshot) !== JSON.stringify(lastSnapshot)) {
        history.value.push(currentSnapshot);
        historyIndex.value = history.value.length - 1;
      }
    };

    const undo = () => {
      if (historyIndex.value > 0) {
        historyIndex.value--;
        treeData.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]));
      }
    };

    const redo = () => {
      if (historyIndex.value < history.value.length - 1) {
        historyIndex.value++;
        treeData.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]));
      }
    };

    const flattenTree = (nodes: TreeNode[], level = 0): any[] => {
      const result: any[] = [];
      nodes.forEach(node => {
        const hasChildren = node.children && node.children.length > 0;
        result.push({
          id: node.id,
          label: node.label,
          level,
          hasChildren,
          expanded: node.expanded,
          category: hasChildren ? 'Группа' : 'Элемент'
        });
        if (node.expanded && node.children) {
          result.push(...flattenTree(node.children, level + 1));
        }
      });
      return result;
    };

    const flattenedData = computed(() =>
      flattenTree(treeData.value).map((item, index) => ({
        ...item,
        rowNumber: index + 1
      }))
    );

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
      const toggleRecursive = (nodes: TreeNode[]) => {
        for (const node of nodes) {
          if (node.id === id) {
            node.expanded = !node.expanded;
            return true;
          }
          if (node.children && toggleRecursive(node.children)) {
            return true;
          }
        }
        return false;
      };
      toggleRecursive(treeData.value);
    };

    const findNodeById = (nodes: TreeNode[], id: number | string): TreeNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNodeById(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const addChild = (parentId: number | string) => {
      saveHistory();
      const parentNode = findNodeById(treeData.value, parentId);
      if (parentNode) {
        if (!parentNode.children) parentNode.children = [];
        parentNode.children.push({
          id: Date.now(),
          label: 'Новый элемент',
          parent: parentNode.id
        });
        parentNode.expanded = true;
        
        // Сохраняем новое состояние после изменения
        const newSnapshot = JSON.parse(JSON.stringify(treeData.value));
        history.value.push(newSnapshot);
        historyIndex.value = history.value.length - 1;
      }
    };

    const removeNode = (id: number | string) => {
      saveHistory();
      const removeRecursive = (nodes: TreeNode[]): TreeNode[] => {
        return nodes
          .filter(node => node.id !== id)
          .map(node => ({
            ...node,
            children: node.children ? removeRecursive(node.children) : []
          }));
      };
      treeData.value = removeRecursive(treeData.value);
      
      // Сохраняем новое состояние после изменения
      const newSnapshot = JSON.parse(JSON.stringify(treeData.value));
      history.value.push(newSnapshot);
      historyIndex.value = history.value.length - 1;
    };

    const editNodeLabel = (id: number | string, currentLabel: string) => {
      const newLabel = prompt('Введите новое название:', currentLabel);
      if (newLabel !== null && newLabel !== currentLabel) {
        saveHistory();
        const node = findNodeById(treeData.value, id);
        if (node) {
          node.label = newLabel;
          
          // Сохраняем новое состояние после изменения
          const newSnapshot = JSON.parse(JSON.stringify(treeData.value));
          history.value.push(newSnapshot);
          historyIndex.value = history.value.length - 1;
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