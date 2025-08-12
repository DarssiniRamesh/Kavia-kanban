/* PUBLIC_INTERFACE */
import React from 'react';
import { useKanban } from '../KanbanContext';

/** PUBLIC_INTERFACE
 * Summary
 * Presentation-friendly page for stakeholders:
 * - Each Kanban column is shown as a row with its title.
 * - Under each row: simple chips listing card titles.
 * - Each card chip shows the feature title and a small assignee tag (if present).
 * - Minimal, clean visuals; no extra controls.
 */
export default function Summary() {
  const { columns, cards, isLoading, error } = useKanban();

  const cardsByColumn = React.useMemo(() => {
    const map = new Map();
    columns.forEach(c => map.set(c.id, []));
    (cards || []).forEach(c => {
      if (map.has(c.column_id)) {
        map.get(c.column_id).push(c);
      }
    });
    // Sort cards by position asc for stable, readable order
    map.forEach(list => list.sort((a, b) => (a.position || 0) - (b.position || 0)));
    return map;
  }, [columns, cards]);

  if (isLoading) {
    return <div className="kanban-loading">Loading...</div>;
  }
  if (error) {
    return <div className="kanban-error">{error}</div>;
  }

  return (
    <div className="container summary-container" style={{ paddingTop: 96, paddingBottom: 32 }}>
      <h1 className="page-title">Summary</h1>
      <p className="page-subtitle">Presentation view of the product board</p>

      <div className="summary-list" role="list" aria-label="Kanban summary by column">
        {columns.map(col => (
          <div className="summary-row" role="listitem" key={col.id}>
            <div className="summary-row-title">
              {col.title}
              <span className="summary-row-count">{(cardsByColumn.get(col.id) || []).length}</span>
            </div>
            <div className="summary-row-chips">
              {(cardsByColumn.get(col.id) || []).map(card => (
                <span className="summary-chip" key={card.id} title={card.description || card.feature}>
                  <span className="summary-chip-title">{card.feature}</span>
                  {card.assignee && (
                    <span className="summary-assignee-tag" title="Assignee">
                      {card.assignee}
                    </span>
                  )}
                </span>
              ))}
              {(cardsByColumn.get(col.id) || []).length === 0 && (
                <span className="summary-empty">No items</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
