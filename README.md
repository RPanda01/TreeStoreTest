
# TreeStoreTest

## Установка

```bash
git clone https://github.com/ТВОЙ_ЛОГИН/TreeStoreTest.git
cd TreeStoreTest
npm install
```

## Запуск проекта

```bash
npm run dev
```

Приложение будет доступно по адресу:
```
http://localhost:5173
```

## Запуск тестов

Для запуска unit-тестов:
```bash
npm run test
```

Для запуска с графическим интерфейсом (Vitest UI):
```bash
npm run test:ui
```

## Структура проекта

- `src/components/TreeTable.vue` — Vue-компонент для отображения дерева с редактированием, добавлением, удалением и undo/redo
- `src/components/TreeTable.test.ts` — unit-тесты для компонента
- `src/stores/TreeStore.ts` — отдельный TypeScript store для работы с деревом (методы getAll, getItem, getChildren и др.)
- `src/stores/TreeStore.test.ts` — unit-тесты для TreeStore
- `src/types/index.ts` — общие типы проекта
- `src/assets/tree-table.css` — вынесенные стили проекта

## Реализованный функционал

- переключение между режимом просмотра и редактирования
- добавление элементов через кнопку «+»
- удаление элементов через кнопку «x»
- редактирование наименования элемента через prompt
- история изменений (undo / redo)
- хранение дерева отдельно в TreeStore
- unit-тесты для всех ключевых методов и компонентов
- вынесенные CSS-стили

## Используемые технологии

- Vue 3
- Vite
- TypeScript
- Vitest
- ag-grid-community
