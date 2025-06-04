import React from 'react';
import { useKanban } from '../KanbanContext';
import CardList from './CardList';
import { CARD_TYPE } from './dndTypes';

/**
 * Column represents a Kanban column (no drag logic here; handled by board parent for DnD).
 * Props for drag visuals: isDragging, isOver (optional).
 */
function Column({ column, index, isDragging, isOver }) {
  const { updateColumn, deleteColumn, cards } = useKanban();
  const colCards = cards.filter(c => c.column_id === column.id).sort((a, b) => a.position - b.position);

  // Modal state: delete/rename
  const [modal, setModal] = React.useState({ type: null });

  const { showToast } = require("../KanbanBoard"); // Import here to avoid circular deps for Feedback

  const handleRename = () => setModal({ type: "rename", value: column.title });
  const handleDelete = () => setModal({ type: "delete" });

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
        aria-label={`Kanban Column: ${column.title}`}
        aria-roledescription="Column"
        style={{
          outline: isOver ? '3.5px solid #38B2AC' : undefined,
          transition: 'outline .18s',
          boxShadow: isDragging ? "0 4px 32px #38B2AC55" : undefined,
          cursor: 'grab'
        }}
        data-column-id={column.id}
        tabIndex={-1}
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
        <span className="sr-only">{isDragging ? 'Dragging column' : ''}</span>
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
