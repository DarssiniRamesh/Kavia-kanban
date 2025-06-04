import React, { useState } from 'react';
import { useKanban } from '../KanbanContext';

// Field badge/pill helpers
function Pill({ value, type }) {
  if (!value) return null;
  let className = "kanban-pill";
  if (type) className += " kanban-pill-" + type.toLowerCase().replace(/\s+/g, "");
  if (type === "priority") {
    if (value === "High" || value === "Critical") className += " pill-high";
    if (value === "Medium") className += " pill-medium";
    if (value === "Low") className += " pill-low";
  }
  if (type === "status") {
    if (value === "To Do") className += " pill-todo";
    if (value === "In Progress") className += " pill-progress";
    if (value === "Done") className += " pill-done";
    if (value === "Review") className += " pill-review";
    if (value === "On Hold") className += " pill-hold";
  }
  return <span className={className}>{value}</span>;
}

// Modal for card detail/expanded view+edit
function Modal({ children, onClose }) {
  return (
    <div className="kanban-modal-overlay" tabIndex={-1} onClick={onClose}>
      <div className="kanban-modal-dialog" onClick={e => e.stopPropagation()}>
        <button className="kanban-modal-close" onClick={onClose} title="Close">×</button>
        {children}
      </div>
    </div>
  );
}

const ASSIGNEES = ["Alice", "Bob", "Charlie", "Unassigned"]; // demo, could be prop/context

/**
 * PUBLIC_INTERFACE
 * Card component representing a Kanban task card.
 * Displays compact view and modal/expanded detail view.
 * The Title (feature) and Description are visually prominent as the primary card fields.
 */
function KanbanCard({ card }) {
  const { updateCard, deleteCard } = useKanban();
  const [edit, setEdit] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [fields, setFields] = useState({
    feature: card.feature,
    description: card.description,
    assignee: card.assignee,
    notes: card.notes,
    priority: card.priority,
    status: card.status,
    due_date: card.due_date,
  });

  // For modal, reset fields on open to always latest value
  const openModal = () => {
    setFields({
      feature: card.feature,
      description: card.description,
      assignee: card.assignee,
      notes: card.notes,
      priority: card.priority,
      status: card.status,
      due_date: card.due_date,
    });
    setModalOpen(true);
    setEdit(false);
  };

  const handleChange = (e) => {
    setFields(f => ({
      ...f,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateCard(card.id, fields);
    setEdit(false);
  };

  // PUBLIC_INTERFACE
  const handleDelete = async () => {
    if (window.confirm('Delete card?')) {
      try {
        const error = await deleteCard(card.id);
        if (error) {
          // Log and show error to user; use window.alert for now for surfacing
          // eslint-disable-next-line no-console
          console.error('[KanbanCard.handleDelete] Error deleting card:', error);
          window.alert('Error deleting card: ' + error);
        } else {
          setModalOpen(false);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[KanbanCard.handleDelete] Exception during card delete:', err);
        window.alert('Unexpected error while deleting card: ' + (err.message || err));
      }
    }
  };

  // Compact Card View
  const compactCard = (
    <div className="kanban-card-inner" onClick={openModal} style={{ cursor: "pointer" }}>
      {/* Visually distinct card header for title and description */}
      <div className="kanban-card-prominent-header">
        <div className="kanban-card-title-prominent">{card.feature}</div>
        {card.description && (
          <div className="kanban-card-desc-prominent">
            {card.description}
          </div>
        )}
      </div>
      <div className="kanban-card-pillrow">
        <Pill value={card.status} type="status"/>
        <Pill value={card.priority} type="priority"/>
        <Pill value={card.assignee} type="assignee"/>
        {card.due_date && (
          <span className="kanban-pill kanban-pill-due" title="Due">
            <span role="img" aria-label="due">🗓️</span> {card.due_date}
          </span>
        )}
      </div>
    </div>
  );

  // Modal/Expanded/Editable Card
  const modalCard = (
    <Modal onClose={() => setModalOpen(false)}>
      <div className="kanban-detail-modal">
        {!edit ? (
          <>
            <div className="kanban-detail-prominent-header">
              <div className="kanban-detail-modal-title-row">
                <span className="kanban-detail-title-prominent">{card.feature}</span>
                <button className="kanban-card-editbtn" onClick={() => setEdit(true)} title="Edit">✎</button>
                <button className="kanban-card-delbtn" onClick={handleDelete}>×</button>
              </div>
              {card.description && (
                <div className="kanban-detail-desc-prominent">
                  {card.description}
                </div>
              )}
              <div className="kanban-detail-divider"/>
            </div>
            <div className="kanban-detail-row">
              <span>Status:</span> <Pill value={card.status} type="status"/>
              <span>Priority:</span> <Pill value={card.priority} type="priority"/>
            </div>
            <div className="kanban-detail-row">
              <span>Assignee:</span> <Pill value={card.assignee} type="assignee"/>
              {card.due_date && (
                <>
                  <span>Due:</span>
                  <span className="kanban-pill kanban-pill-due">
                    <span role="img" aria-label="due">🗓️</span> {card.due_date}
                  </span>
                </>
              )}
            </div>
            <div className="kanban-detail-section">
              <div className="kanban-detail-label">Notes</div>
              <div className="kanban-detail-content">{card.notes || <span className="missing-info">None</span>}</div>
            </div>
            <button className="btn" style={{marginTop:18, width:"100%"}} onClick={() => setEdit(true)}>Edit Card</button>
          </>
        ) : (
          <form className="kanban-edit-card-form" onSubmit={handleSubmit}>
            <div className="kanban-form-grid">
              <input name="feature" value={fields.feature} onChange={handleChange} required placeholder="Feature/Title"/>
              <select name="assignee" value={fields.assignee||""} onChange={handleChange}>
                <option value="">Assignee</option>
                {ASSIGNEES.map(a => (<option value={a} key={a}>{a}</option>))}
              </select>
              <select name="priority" value={fields.priority||""} onChange={handleChange}>
                <option value="">Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              <select name="status" value={fields.status||""} onChange={handleChange}>
                <option value="">Status</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Done">Done</option>
                <option value="On Hold">On Hold</option>
              </select>
              <input name="due_date" type="date" value={fields.due_date||""} onChange={handleChange}/>
            </div>
            <textarea name="description" value={fields.description||""} onChange={handleChange} placeholder="Description"/>
            <textarea name="notes" value={fields.notes||""} onChange={handleChange} placeholder="Notes"/>
            <div className="kanban-modal-form-buttons">
              <button className="btn" type="submit">Save</button>
              <button className="btn" type="button" onClick={()=>setEdit(false)}>Cancel</button>
              <button className="btn" type="button" onClick={handleDelete} style={{marginLeft:"auto"}}>Delete</button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );

  return (
    <div className="kanban-card">
      {/* Show compact or modal card */}
      {modalOpen ? modalCard : compactCard}
    </div>
  );
}

export default KanbanCard;
