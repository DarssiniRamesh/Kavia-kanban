import React, { useMemo, useState, useRef } from "react";
import { useKanban } from "../KanbanContext";
import "./FilterPanel.css";

// Basic utility to get unique values for a field among all cards.
function getUniqueFieldValues(cards, field) {
  return Array.from(
    new Set(cards.map((c) => (c[field] || "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

function filterCards(cards, filters, columns) {
  // Returns filtered cards based on filters object:
  // { assignees: [], priorities: [], statuses: [], columns: [], dueRange: [from, to] }
  return cards.filter((c) => {
    if (
      filters.assignees.length > 0 &&
      (!c.assignee || !filters.assignees.includes(c.assignee))
    )
      return false;

    if (
      filters.priorities.length > 0 &&
      (!c.priority || !filters.priorities.includes(c.priority))
    )
      return false;

    if (
      filters.statuses.length > 0 &&
      (!c.status || !filters.statuses.includes(c.status))
    )
      return false;

    if (
      filters.columns.length > 0 &&
      (!c.column_id || !filters.columns.includes(c.column_id))
    )
      return false;

    if (filters.dueFrom || filters.dueTo) {
      if (c.due_date) {
        const date = c.due_date;
        if (
          (filters.dueFrom && date < filters.dueFrom) ||
          (filters.dueTo && date > filters.dueTo)
        )
          return false;
      } else {
        return false;
      }
    }

    return true;
  });
}

export default function FilterPanel({ onFiltersChange }) {
  const { cards, columns } = useKanban();
  // Always renders latest field options, no global list

  const [filters, setFilters] = useState({
    assignees: [],
    priorities: [],
    statuses: [],
    columns: [],
    dueFrom: "",
    dueTo: "",
  });

  // Expose callback on filter change
  React.useEffect(() => {
    if (onFiltersChange) onFiltersChange(filters);
    // eslint-disable-next-line
  }, [filters]);

  // Compute available options from current board/cards
  const assigneeOptions = useMemo(
    () => getUniqueFieldValues(cards, "assignee"),
    [cards]
  );
  const priorityOptions = useMemo(
    () => getUniqueFieldValues(cards, "priority"),
    [cards]
  );
  const statusOptions = useMemo(
    () => getUniqueFieldValues(cards, "status"),
    [cards]
  );
  const columnOptions = useMemo(
    () => columns.map((col) => ({ id: col.id, title: col.title })),
    [columns]
  );

  // Typeahead state
  const [assigneeInput, setAssigneeInput] = useState("");
  const assigneeInputRef = useRef();

  // Handler: Add/remove from filter
  function handleSelectChange(field, value, type = "toggle") {
    setFilters((prev) => {
      if (type === "add") {
        if (prev[field].includes(value)) return prev;
        return { ...prev, [field]: [...prev[field], value] };
      }
      if (type === "remove") {
        return { ...prev, [field]: prev[field].filter((v) => v !== value) };
      }
      // toggle
      if (prev[field].includes(value)) {
        return { ...prev, [field]: prev[field].filter((v) => v !== value) };
      } else {
        return { ...prev, [field]: [...prev[field], value] };
      }
    });
  }

  function handleAssigneeInput(e) {
    setAssigneeInput(e.target.value);
  }

  function handleAssigneeInputKey(e) {
    if (e.key === "Enter" && assigneeInput.trim()) {
      handleSelectChange("assignees", assigneeInput.trim(), "add");
      setAssigneeInput("");
      assigneeInputRef.current && assigneeInputRef.current.blur();
    }
  }

  // Date range change
  function handleDateChange(type, val) {
    setFilters((prev) => ({
      ...prev,
      [type]: val,
    }));
  }

  // Clear individual filter
  function clearFilter(field, value = null) {
    setFilters((prev) => {
      if (value) {
        return { ...prev, [field]: prev[field].filter((v) => v !== value) };
      }
      // Clear all of the field
      if (["dueFrom", "dueTo"].includes(field))
        return { ...prev, [field]: "" };
      return { ...prev, [field]: [] };
    });
  }

  // Clear all filters
  function resetFilters() {
    setFilters({
      assignees: [],
      priorities: [],
      statuses: [],
      columns: [],
      dueFrom: "",
      dueTo: "",
    });
    setAssigneeInput("");
  }

  // Helper to render chips for current filter values
  function renderChips() {
    const chips = [];
    filters.assignees.forEach((a) =>
      chips.push({
        label: `Assignee: ${a}`,
        field: "assignees",
        value: a,
      })
    );
    filters.priorities.forEach((p) =>
      chips.push({
        label: `Priority: ${p}`,
        field: "priorities",
        value: p,
      })
    );
    filters.statuses.forEach((s) =>
      chips.push({
        label: `Status: ${s}`,
        field: "statuses",
        value: s,
      })
    );
    filters.columns.forEach((colId) => {
      const col = columnOptions.find((c) => c.id === colId);
      chips.push({
        label: `Column: ${col ? col.title : colId}`,
        field: "columns",
        value: colId,
      });
    });
    if (filters.dueFrom)
      chips.push({
        label: `Due ≥ ${filters.dueFrom}`,
        field: "dueFrom",
        value: null,
      });
    if (filters.dueTo)
      chips.push({
        label: `Due ≤ ${filters.dueTo}`,
        field: "dueTo",
        value: null,
      });
    return chips;
  }

  return (
    <section className="kanban-filter-panel">
      {/* Visual layout - horizontal, at top of board */}
      <div className="filter-row">
        <div className="filter-group">
          <label>Assignee</label>
          <div className="filter-assignee-typeahead">
            <input
              ref={assigneeInputRef}
              value={assigneeInput}
              onChange={handleAssigneeInput}
              onKeyDown={handleAssigneeInputKey}
              placeholder="Type or Pick..."
              size={13}
              aria-label="Filter by assignee"
              list="kanban-filter-assignee-options"
              className="filter-typeahead-input"
            />
            <datalist id="kanban-filter-assignee-options">
              {assigneeOptions.map((a) => (
                <option value={a} key={a} />
              ))}
            </datalist>
            <div className="filter-chip-group">
              {filters.assignees.map((a) => (
                <span className="filter-chip" key={a}>
                  {a}{" "}
                  <button
                    type="button"
                    onClick={() => clearFilter("assignees", a)}
                    aria-label={`Remove Assignee ${a}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="filter-group">
          <label>Priority</label>
          <select
            multiple
            size={priorityOptions.length || 3}
            value={filters.priorities}
            onChange={(e) => {
              // Convert from select options
              const selected = Array.from(
                e.target.selectedOptions,
                (o) => o.value
              );
              setFilters((prev) => ({ ...prev, priorities: selected }));
            }}
            className="filter-multiselect"
          >
            {priorityOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select
            multiple
            size={statusOptions.length || 3}
            value={filters.statuses}
            onChange={(e) => {
              const selected = Array.from(
                e.target.selectedOptions,
                (o) => o.value
              );
              setFilters((prev) => ({ ...prev, statuses: selected }));
            }}
            className="filter-multiselect"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Column</label>
          <select
            multiple
            size={columnOptions.length || 2}
            value={filters.columns}
            onChange={(e) => {
              const selected = Array.from(
                e.target.selectedOptions,
                (o) => o.value
              );
              setFilters((prev) => ({ ...prev, columns: selected }));
            }}
            className="filter-multiselect"
          >
            {columnOptions.map((col) => (
              <option key={col.id} value={col.id}>
                {col.title}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group filter-dates">
          <label>Due Date</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="date"
              value={filters.dueFrom}
              onChange={(e) => handleDateChange("dueFrom", e.target.value)}
              className="filter-date"
              aria-label="Due date from"
            />
            <span style={{ color: "#888" }}>—</span>
            <input
              type="date"
              value={filters.dueTo}
              onChange={(e) => handleDateChange("dueTo", e.target.value)}
              className="filter-date"
              aria-label="Due date to"
            />
          </div>
        </div>
        <div className="filter-group filter-actions">
          <button
            type="button"
            onClick={resetFilters}
            className="btn filter-reset-btn"
            aria-label="Reset all filters"
          >
            Reset
          </button>
        </div>
      </div>
      {/* Chips for all applied filters */}
      <div className="filter-chipbar">
        {renderChips().map((chip, i) => (
          <span className="filter-chip" key={chip.label}>
            {chip.label}{" "}
            <button
              type="button"
              title="Remove filter"
              aria-label={`Remove ${chip.label}`}
              onClick={() => clearFilter(chip.field, chip.value)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </section>
  );
}
