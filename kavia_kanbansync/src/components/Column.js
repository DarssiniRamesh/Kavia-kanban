import React from 'react';
import { useKanban } from '../KanbanContext';
import CardList from './CardList';
import { useDrop } from 'react-dnd';

// Drop types
export const CARD_TYPE = 'KANBAN_CARD';

function Column({ column, index }) {
  const { updateColumn, deleteColumn, cards, updateCard, reorderCardsInColumn } = useKanban();

  const colCards = cards.filter(c => c.column_id === column.id).sort((a, b) => a.position - b.position);

  // Accepts drops of cards for moving into this column
  const [{ canDrop, isOver }, drop] = useDrop({
    accept: CARD_TYPE,
    canDrop: (item) => !!item, // Accept all cards for move
    drop: async (item, monitor) => {
      if (!item) return;
      if (item.column_id !== column.id) {
        // Move card into this column at end
        // Set new column_id and position
        const newPos = colCards.length ? Math.max(...colCards.map(c=>c.position)) + 1 : 1;
        await updateCard(item.id, { column_id: column.id, position: newPos });
        // Local optimistic update is via realtime sync
      }
      // else handled inside CardList for intra-column
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: monitor.canDrop()
    }),
  });

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
    <div
      className="kanban-column"
      ref={drop}
      style={{
        outline: (isOver && canDrop) ? '3px solid #38B2AC' : undefined,
        transition: 'outline .18s'
      }}
      data-column-id={column.id}
    >
      <div className="kanban-column-header">
        <span className="kanban-column-title" onDoubleClick={handleRename}>
          {column.title}
        </span>
        <button className="kanban-column-delbtn" onClick={handleDelete} title="Delete column">
          ×
        </button>
      </div>
      <CardList column={column} cards={colCards} />
    </div>
  );
}

export default Column;
