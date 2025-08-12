import React from 'react';
import { useKanban } from '../KanbanContext';

/**
 * PUBLIC_INTERFACE
 * Summary
 * A presentation-friendly, single-slide-styled page for stakeholders.
 * - Each Kanban column renders as a prominent row with a bold header.
 * - A horizontal grid/list of card titles is displayed under each header.
 * - Each card chip includes the feature title and an assignee tag (if present).
 * - All app controls/decorations are hidden (via body class toggle).
 * - Large, readable fonts with subtle color, whitespace, and balance.
 */
export default function Summary() {
  const { columns, cards, isLoading, error } = useKanban();

  // Toggle "slide" mode to hide global chrome (navbar, etc.)
  React.useEffect(() => {
    document.body.classList.add('summary-slide-mode');
    return () => {
      document.body.classList.remove('summary-slide-mode');
    };
  }, []);

  // Map cards by column for clean rendering (sorted by position)
  const cardsByColumn = React.useMemo(() => {
    const map = new Map();
    (columns || []).forEach((c) => map.set(c.id, []));
    (cards || []).forEach((c) => {
      if (map.has(c.column_id)) map.get(c.column_id).push(c);
    });
    map.forEach((list) =>
      list.sort((a, b) => (a.position || 0) - (b.position || 0))
    );
    return map;
  }, [columns, cards]);

  // Subtle status color dot for chips
  function getStatusDotColor(status) {
    const st = (status || '').toLowerCase();
    if (st.includes('progress')) return '#E1986E';
    if (st.includes('done')) return '#36B37E';
    if (st.includes('review')) return '#D3A94E';
    if (st.includes('hold')) return '#D7827F';
    if (st.includes('todo')) return '#A0A4AE';
    return '#CFCFD4';
  }

  if (isLoading) {
    return <div className="kanban-loading">Loading...</div>;
  }
  if (error) {
    return <div className="kanban-error">{error}</div>;
  }

  return (
    <div className="container summary-container summary-slide">
      <h1 className="page-title" style={{ marginTop: 8, marginBottom: 10 }}>
        Board Summary
      </h1>
      <p className="page-subtitle" style={{ marginBottom: 24 }}>
        Presentation view (clean slide layout)
      </p>

      <div className="summary-list" role="list" aria-label="Kanban summary by column">
        {(columns || []).map((col, i) => {
          const items = cardsByColumn.get(col.id) || [];
          return (
            <section
              className="summary-row"
              role="listitem"
              aria-roledescription="Column summary"
              key={col.id}
            >
              <header className="summary-row-title" aria-label={`Column ${col.title}`}>
                <span className="summary-row-title-text">{col.title}</span>
                <span className="summary-row-count" title="Card count">
                  {items.length}
                </span>
              </header>

              <div className="summary-row-chips">
                {items.map((card) => (
                  <span
                    className="summary-chip"
                    key={card.id}
                    title={card.description || card.feature}
                  >
                    <span
                      className="summary-chip-dot"
                      aria-hidden
                      style={{ background: getStatusDotColor(card.status) }}
                    />
                    <span className="summary-chip-title">{card.feature}</span>
                    {card.assignee && (
                      <span className="summary-assignee-tag" title="Assignee">
                        @{card.assignee}
                      </span>
                    )}
                  </span>
                ))}
                {items.length === 0 && <span className="summary-empty">No items</span>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
