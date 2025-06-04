import React, { useState } from 'react';
import { useKanban } from '../KanbanContext';
import KanbanCard from './KanbanCard';

function CardList({ column }) {
  const { cards, addCard } = useKanban();
  const [adding, setAdding] = useState(false);

  const colCards = cards.filter(c => c.column_id === column.id).sort((a, b) => a.position - b.position);

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
    <div className="kanban-card-list">
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
      {colCards.map(card => (
        <KanbanCard key={card.id} card={card} />
      ))}
    </div>
  );
}

export default CardList;
