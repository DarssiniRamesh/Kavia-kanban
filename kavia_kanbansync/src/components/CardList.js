import React, { useState, useRef } from 'react';
import { useKanban } from '../KanbanContext';
import KanbanCard from './KanbanCard';
import { useDrop } from 'react-dnd';
import { CARD_TYPE } from './Column';

/**
 * CardList supports dropping cards for intra-column reordering (vertical movement),
 * and renders cards with drag/hover context.
 */
function CardList({ column, cards: colCardsProp }) {
  // colCards: sorted - passed in or computed
  const { cards, addCard, updateCard, reorderCardsInColumn } = useKanban();
  const [adding, setAdding] = useState(false);

  // Prefer passed colCards (sorted), but fallback for tests:
  const colCards = colCardsProp ||
    cards.filter(c => c.column_id === column.id).sort((a, b) => a.position - b.position);

  // Used to bring focus to the drop zone for empty columns
  const emptyDropRef = useRef(null);

  // For dropping a card into an empty column (or below/above all)
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: CARD_TYPE,
    canDrop: (item) => !!item,
    drop: async (item, monitor) => {
      // If dropping into a column with no cards
      if (colCards.length === 0) {
        // Place card at pos 1, update column_id
        await updateCard(item.id, { column_id: column.id, position: 1 });
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleAddCard = async (e) => {
    e.preventDefault();
    const feature = e.target.feature.value.trim();
    if (!feature) return;
    const description = e.target.description.value;
    const assignee = e.target.assignee.value;
    const notes = e.target.notes.value;
    const priority = e.target.priority.value;
    const status = e.target.status.value;
    const due_date = e.target.due_date.value;
    await addCard(column.id, { feature, description, assignee, notes, priority, status, due_date });
    setAdding(false);
    e.target.reset();
  };

  return (
    <div
      className="kanban-card-list"
      ref={colCards.length === 0 ? drop : undefined}
      style={{
        minHeight: 34,
        background: isOver && canDrop && colCards.length === 0 ? '#22326944' : undefined,
        border: isOver && canDrop && colCards.length === 0 ? '2px dashed #38B2AC' : undefined,
        borderRadius: isOver && canDrop && colCards.length === 0 ? 7 : undefined,
        transition: 'background 0.16s, border 0.16s'
      }}
    >
      <button className="btn" style={{ width: '100%', margin: '4px 0' }} onClick={() => setAdding(a=>!a)}>
        + Add Card
      </button>

      {adding && (
        <form className="kanban-add-card-form" onSubmit={handleAddCard}>
          <input name="feature" placeholder="Feature/Title" required />
          <div className="kanban-form-grid">
            {/* Demo list of assignees for dropdown */}
            <select name="assignee" defaultValue="">
              <option value="">Assignee</option>
              <option value="Alice">Alice</option>
              <option value="Bob">Bob</option>
              <option value="Charlie">Charlie</option>
              <option value="Unassigned">Unassigned</option>
            </select>
            <select name="priority" defaultValue="">
              <option value="">Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            <select name="status" defaultValue="">
              <option value="">Status</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Done">Done</option>
              <option value="On Hold">On Hold</option>
            </select>
            <input name="due_date" type="date" />
          </div>
          <textarea name="description" placeholder="Description" />
          <textarea name="notes" placeholder="Notes" />
          <div style={{display: "flex", gap: 8}}>
            <button className="btn" type="submit">Add</button>
            <button className="btn" type="button" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </form>
      )}
      {colCards.map((card, i) => (
        <DnDKanbanCard
          key={card.id}
          card={card}
          index={i}
          column={column}
          colCards={colCards}
        />
      ))}
    </div>
  );
}

// DnDKanbanCard wraps KanbanCard with drag/drop
import { useDrag } from 'react-dnd';

// PUBLIC_INTERFACE
function DnDKanbanCard({ card, index, column, colCards }) {
  const { updateCard } = useKanban();

  // Drag setup
  const [{ isDragging }, drag] = useDrag({
    type: CARD_TYPE,
    item: {
      type: CARD_TYPE,
      id: card.id,
      column_id: card.column_id,
      origIndex: index,
      card,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Drop logic for reorder in this column or moving card to this column above/below
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: CARD_TYPE,
    canDrop: (item) => item.id !== card.id,
    hover: (item, monitor) => {
      // Visual cue handled below
    },
    drop: async (item, monitor) => {
      if (item.id === card.id) return;
      if (item.column_id === column.id) {
        // Move within column (reorder)
        // To reorder: swap positions
        const movingCard = colCards.find(c => c.id === item.id);
        if (!movingCard) return;
        const targetPos = card.position;

        // Only adjust if not same position (no op)
        if (movingCard.position !== targetPos) {
          // Compute new ordering: remove moving card, insert at drop index
          let newOrder = [...colCards];
          newOrder = newOrder.filter(c => c.id !== movingCard.id);

          // Find insert index
          const targetIndex = colCards.findIndex(c => c.id === card.id);
          newOrder.splice(targetIndex, 0, movingCard);

          // Renumber positions (1-based)
          for (let idx = 0; idx < newOrder.length; ++idx) {
            newOrder[idx] = { ...newOrder[idx], position: idx + 1 };
          }

          // Batch update
          try {
            await Promise.all(newOrder.map(c =>
              updateCard(c.id, { position: c.position })
            ));
          } catch (err) {
            window.alert('Failed to reorder cards: ' + (err.message || err));
          }
        }
      } else {
        // Move to new column at drop index (or append if not on a card)
        // This will move card to new column and position
        try {
          // Place above dropped card
          const toColCards = colCards.filter(c => c.id !== item.id);
          let insertIdx = toColCards.findIndex(c => c.id === card.id);
          if (insertIdx === -1) insertIdx = 0;
          // Insert and renumber
          const movingCard = { ...item.card, column_id: column.id };
          toColCards.splice(insertIdx, 0, movingCard);

          for (let idx = 0; idx < toColCards.length; ++idx) {
            toColCards[idx] = { ...toColCards[idx], position: idx + 1 };
          }
          // Update card being moved
          await updateCard(item.id, { column_id: column.id, position: insertIdx + 1 });
          // (realtime sync handles the rest)
        } catch (err) {
          window.alert('Failed to move card across columns: ' + (err.message || err));
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  // Use both refs for drag-n-drop
  const ref = React.useRef(null);
  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.32 : 1,
        border: (isOver && canDrop) ? '2.5px solid #38B2AC' : undefined,
        boxShadow: isDragging ? '0 4px 18px 0 #38B2AC33' : undefined,
        background: (isOver && canDrop) ? '#13204e' : undefined,
        zIndex: isDragging ? 80 : 1,
        transition: 'background .15s, border .15s, opacity .14s, box-shadow .16s'
      }}
    >
      <KanbanCard card={card} />
    </div>
  );
}

export default CardList;
