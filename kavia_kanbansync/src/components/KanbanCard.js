import React, { useState } from 'react';
import { useKanban } from '../KanbanContext';

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 2 }}>
      <span style={{ fontWeight: 600 }}>{label}: </span>
      <span>{value}</span>
    </div>
  );
}

// PUBLIC_INTERFACE
function KanbanCard({ card }) {
  const { updateCard, deleteCard } = useKanban();
  const [edit, setEdit] = useState(false);
  const [fields, setFields] = useState({
    feature: card.feature,
    description: card.description,
    assignee: card.assignee,
    notes: card.notes,
    priority: card.priority,
    status: card.status,
    due_date: card.due_date,
  });

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

  const handleDelete = async () => {
    if (window.confirm('Delete card?')) {
      await deleteCard(card.id);
    }
  };

  return (
    <div className="kanban-card">
      {edit ? (
        <form className="kanban-edit-card-form" onSubmit={handleSubmit}>
          <input name="feature" value={fields.feature} onChange={handleChange} required />
          <input name="assignee" value={fields.assignee||""} onChange={handleChange} />
          <input name="priority" value={fields.priority||""} onChange={handleChange} />
          <input name="status" value={fields.status||""} onChange={handleChange} />
          <input name="due_date" value={fields.due_date||""} onChange={handleChange} />
          <textarea name="description" value={fields.description||""} onChange={handleChange} />
          <textarea name="notes" value={fields.notes||""} onChange={handleChange} />
          <div>
            <button className="btn" type="submit">Save</button>
            <button className="btn" type="button" onClick={()=>setEdit(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <div className="kanban-card-main">
            <strong style={{ fontSize:'1rem', color:'#38B2AC'}}>{card.feature}</strong>
            <button className="kanban-card-editbtn" onClick={() => setEdit(true)} title="Edit">
              ✎
            </button>
            <button className="kanban-card-delbtn" onClick={handleDelete}>×</button>
          </div>
          <div className="kanban-card-fields">
            <Field label="Due" value={card.due_date} />
            <Field label="Priority" value={card.priority} />
            <Field label="Status" value={card.status} />
            <Field label="Assignee" value={card.assignee} />
            <Field label="Description" value={card.description} />
            <Field label="Notes" value={card.notes} />
          </div>
        </>
      )}
    </div>
  );
}

export default KanbanCard;
