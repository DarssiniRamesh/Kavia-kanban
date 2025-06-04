import React from 'react';
import { useKanban } from '../KanbanContext';
import CardList from './CardList';

function Column({ column }) {
  const { updateColumn, deleteColumn } = useKanban();

  const handleRename = () => {
    const newTitle = prompt('Rename column:', column.title);
    if (newTitle && newTitle !== column.title) {
      updateColumn(column.id, { title: newTitle });
    }
  };
  const handleDelete = () => {
    if (window.confirm('Delete this column and all cards inside?')) {
      deleteColumn(column.id);
    }
  };

  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <span className="kanban-column-title" onDoubleClick={handleRename}>
          {column.title}
        </span>
        <button className="kanban-column-delbtn" onClick={handleDelete} title="Delete column">
          ×
        </button>
      </div>
      <CardList column={column} />
    </div>
  );
}

export default Column;
