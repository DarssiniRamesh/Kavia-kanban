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

  // Modal state: delete/rename
  const [modal, setModal] = React.useState({ type: null });

  const { showToast } = require("../KanbanBoard"); // Import here to avoid circular deps for Feedback

  const handleRename = () => {
    setModal({ type: "rename", value: column.title });
  };

  const handleDelete = () => {
    setModal({ type: "delete" });
  };

  const doRename = async () => {
    if (
      modal.value &&
      modal.value.trim() &&
      modal.value !== column.title
    ) {
      await updateColumn(column.id, { title: modal.value.trim() });
      showToast && showToast("Column renamed!", "success");
    }
    setModal({ type: null });
  };

  const doDelete = async () => {
    await deleteColumn(column.id);
    showToast && showToast("Column deleted.", "success");
    setModal({ type: null });
  };

  return (
    <>
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
      {/* Rename Modal */}
      {modal.type === "rename" && (
        <div className="kanban-modal-overlay" onClick={() => setModal({ type: null })}>
          <div className="kanban-modal-dialog" onClick={e => e.stopPropagation()}>
            <button className="kanban-modal-close" onClick={() => setModal({ type: null })} title="Close">×</button>
            <div style={{ fontWeight: 700, fontSize: '1.19em', marginBottom: 11 }}>Rename Column</div>
            <input
              autoFocus
              type="text"
              value={modal.value}
              onChange={e => setModal(m => ({ ...m, value: e.target.value }))}
              style={{ padding: 6, fontSize: '1.08em', width: '100%', marginBottom: 16, borderRadius: 4, border: '1px solid #334266' }}
              onKeyDown={e => { if (e.key === "Enter") doRename(); }}
            />
            <div style={{ display: "flex", gap: 9 }}>
              <button className="btn" onClick={doRename}>Save</button>
              <button className="btn" type="button" onClick={() => setModal({ type: null })}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirm Modal */}
      {modal.type === "delete" && (
        <div className="kanban-modal-overlay" onClick={() => setModal({ type: null })}>
          <div className="kanban-modal-dialog" onClick={e => e.stopPropagation()}>
            <button className="kanban-modal-close" onClick={() => setModal({ type: null })} title="Close">×</button>
            <div style={{ color: '#ff9e9e', fontWeight: 700, fontSize: '1.15em', marginBottom: 15 }}>
              Delete this column?
            </div>
            <div style={{ marginBottom: 17 }}>
              This will permanently delete <strong>all cards in this column</strong>.<br />Are you sure?
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" style={{ background: "#c13a2b" }} onClick={doDelete}>Yes, Delete</button>
              <button className="btn" style={{ marginLeft: 10 }} onClick={() => setModal({ type: null })}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Column;
