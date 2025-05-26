<template>
  <div id="app">
    <TreeTable />
  </div>
</template>

<script lang="ts">
import TreeTable from './components/TreeTable.vue';

export default {
  name: 'App',
  components: {
    TreeTable
  }
};
</script>

<style>
/* Импорт стилей AG-Grid */
@import 'ag-grid-community/styles/ag-grid.css';
@import 'ag-grid-community/styles/ag-theme-alpine.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  width: 100vw;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f8f9fa;
}

body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* Дополнительные стили для улучшения внешнего вида */
.tree-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 10px;
  height: calc(100vh - 20px);
}
</style>