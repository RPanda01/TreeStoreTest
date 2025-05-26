import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import TreeTable from './TreeTable.vue';

// Мокаем AG Grid Vue компонент
const mockAgGridVue = {
  template: '<div class="mock-ag-grid" @click="$emit(\'cellClicked\', mockCellEvent)"></div>',
  props: ['rowData', 'columnDefs', 'animateRows', 'suppressRowClickSelection'],
  emits: ['cellClicked'],
  data() {
    return {
      mockCellEvent: null
    };
  },
  methods: {
    simulateCellClick(event: any) {
      this.mockCellEvent = event;
      this.$emit('cellClicked', event);
    }
  }
};

describe('TreeTable.vue', () => {
  let wrapper: VueWrapper<any>;
  let promptMock: any;

  beforeEach(() => {
    // Мокаем AG Grid компоненты
    wrapper = mount(TreeTable, {
      global: {
        components: {
          'ag-grid-vue': mockAgGridVue
        }
      }
    });

    // Мокаем промт для переименования
    promptMock = vi.spyOn(global, 'prompt').mockImplementation(() => 'Новое имя');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders properly with initial data', () => {
      expect(wrapper.find('.tree-table-container').exists()).toBe(true);
      expect(wrapper.find('.toolbar').exists()).toBe(true);
      expect(wrapper.text()).toContain('Режим: просмотр');
      expect(wrapper.text()).toContain('Редактировать');
    });

    it('displays correct initial tree structure', () => {
      const vm = wrapper.vm;
      const flattenedData = vm.flattenedData;
      expect(flattenedData.length).toBeGreaterThan(0);
      expect(flattenedData.some((item: any) => item.label === 'Айтем 1')).toBe(true);
      expect(flattenedData.some((item: any) => item.label === 'Айтем 2')).toBe(true);
    });
  });

  describe('Edit Mode Toggle', () => {
    it('enters edit mode on button click', async () => {
      const editButton = wrapper.find('button');
      expect(wrapper.vm.isEditMode).toBe(false);

      await editButton.trigger('click');
      await nextTick();

      expect(wrapper.vm.isEditMode).toBe(true);
      expect(wrapper.text()).toContain('Выйти из редактирования');
    });

    it('exits edit mode when clicked again', async () => {
      const editButton = wrapper.find('button');

      // Входим в режим редактирования
      await editButton.trigger('click');
      await nextTick();
      expect(wrapper.vm.isEditMode).toBe(true);

      // Выходим из режима редактирования
      await editButton.trigger('click');
      await nextTick();
      expect(wrapper.vm.isEditMode).toBe(false);
      expect(wrapper.text()).toContain('Редактировать');
    });
  });

  describe('Tree Operations', () => {
  beforeEach(async () => {
    // Входим в режим редактирования
    const editButton = wrapper.find('button');
    await editButton.trigger('click');
    await nextTick();
  });

  it('adds a child node', async () => {
    const vm = wrapper.vm;
    const initialCount = vm.flattenedData.length;

    // Симулируем клик на + у первого элемента (id 1)
    wrapper.findComponent(mockAgGridVue).vm.simulateCellClick({
      colDef: { field: 'label' },
      data: { id: 1 },
      event: { target: { classList: { contains: (cls: string) => cls === 'add-btn' } } }
    });
    await nextTick();

    const newCount = vm.flattenedData.length;
    expect(newCount).toBeGreaterThan(initialCount);
  });

  it('removes a node', async () => {
    const vm = wrapper.vm;
    const initialCount = vm.flattenedData.length;

    // Симулируем клик на × у первого элемента (id 1)
    wrapper.findComponent(mockAgGridVue).vm.simulateCellClick({
      colDef: { field: 'label' },
      data: { id: 1 },
      event: { target: { classList: { contains: (cls: string) => cls === 'delete-btn' } } }
    });
    await nextTick();

    const newCount = vm.flattenedData.length;
    expect(newCount).toBeLessThan(initialCount);
  });

  it('renames a node', async () => {
    const vm = wrapper.vm;
    const targetId = 1;

    // Симулируем клик на название
    wrapper.findComponent(mockAgGridVue).vm.simulateCellClick({
      colDef: { field: 'label' },
      data: { id: targetId, label: 'Айтем 1' },
      event: { target: { classList: { contains: () => false } } }
    });
    await nextTick();

    const renamedNode = vm.flattenedData.find((item: any) => item.id === targetId);
    expect(renamedNode.label).toBe('Новое имя');
  });

  it('undoes an action', async () => {
    const vm = wrapper.vm;
    const initialCount = vm.flattenedData.length;

    // Добавляем элемент
    wrapper.findComponent(mockAgGridVue).vm.simulateCellClick({
      colDef: { field: 'label' },
      data: { id: 1 },
      event: { target: { classList: { contains: (cls: string) => cls === 'add-btn' } } }
    });
    await nextTick();

    const afterAddCount = vm.flattenedData.length;
    expect(afterAddCount).toBeGreaterThan(initialCount);

    // Жмём отмену
    await wrapper.findAll('button').find(btn => btn.text().includes('Отменить'))?.trigger('click');
    await nextTick();

    const afterUndoCount = vm.flattenedData.length;
    expect(afterUndoCount).toBe(initialCount);
  });

  it('reapplies an undone action', async () => {
    const vm = wrapper.vm;
    const initialCount = vm.flattenedData.length;

    // Добавляем элемент
    wrapper.findComponent(mockAgGridVue).vm.simulateCellClick({
      colDef: { field: 'label' },
      data: { id: 1 },
      event: { target: { classList: { contains: (cls: string) => cls === 'add-btn' } } }
    });
    await nextTick();

    const afterAddCount = vm.flattenedData.length;
    expect(afterAddCount).toBeGreaterThan(initialCount);

    // Жмём отмену
    await wrapper.findAll('button').find(btn => btn.text().includes('Отменить'))?.trigger('click');
    await nextTick();

    const afterUndoCount = vm.flattenedData.length;
    expect(afterUndoCount).toBe(initialCount);

    // Жмём повтор
    await wrapper.findAll('button').find(btn => btn.text().includes('Повторить'))?.trigger('click');
    await nextTick();

    const afterRedoCount = vm.flattenedData.length;
    expect(afterRedoCount).toBe(afterAddCount);
  });
});

});