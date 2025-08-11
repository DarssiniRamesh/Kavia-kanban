import React, { useMemo, useState, useRef } from "react";
import { useKanban } from "../KanbanContext";
import "./FilterPanel.css";

/**
 * Helper: Get unique values for a field among all cards (case-insensitive, trimmed, deduped).
 */
function getUniqueFieldValues(cards, field) {
  return Array.from(
    new Set(cards.map((c) => (c[field] || "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

// Helper: badge, returns styled count
function Badge({ n }) {
  return n ? (
    <span className="filter-badge" aria-label={`${n} selected`}>
      {n}
    </span>
  ) : null;
}

/**
 * PUBLIC_INTERFACE
 * Modern, grouped, accessible FilterPanel for Kanban board. 
 * Features: grouped controls, touch-optimized, accessible cues, modern visuals.
 */
export default function FilterPanel({ onFiltersChange }) {
  const { cards, columns } = useKanban();

  // Main filter state
  const [filters, setFilters] = useState({
    assignees: [],
    priorities: [],
    statuses: [],
    columns: [],
    dueFrom: "",
    dueTo: "",
  });

  React.useEffect(() => {
    if (onFiltersChange) onFiltersChange(filters);
    // eslint-disable-next-line
  }, [filters]);

  // Dynamically computed options
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

  // Typeahead input for assignee (mobile touch-friendliness)
  const [assigneeInput, setAssigneeInput] = useState("");
  const assigneeInputRef = useRef();
  const undoStack = useRef({});

  // Utility: determine visual active state
  const isActive = (field) => {
    if (["dueFrom", "dueTo"].includes(field)) return !!filters[field];
    return Array.isArray(filters[field]) && filters[field].length > 0;
  };

  // Utility: can undo per field
  const canUndo = (field) => !!undoStack.current[field];

  // --- Generic handlers ---

  // For chips & multi-toggle
  function handleToggleFilter(field, value) {
    setFilters((prev) => {
      if (!Array.isArray(prev[field])) return prev;
      let newArr = prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value];
      undoStack.current[field] = prev[field];
      return { ...prev, [field]: newArr };
    });
  }

  // For select-multi fields
  function handleMultiSelect(field, arr) {
    undoStack.current[field] = filters[field];
    setFilters((prev) => ({ ...prev, [field]: arr }));
  }

  // For adding new Assignee from typeahead
  function handleAssigneeInput(e) {
    setAssigneeInput(e.target.value);
  }

  function handleAssigneeKeyDown(e) {
    if (e.key === "Enter" && assigneeInput.trim()) {
      if (!filters.assignees.includes(assigneeInput.trim())) {
        undoStack.current.assignees = filters.assignees;
        setFilters((prev) => ({
          ...prev,
          assignees: [...prev.assignees, assigneeInput.trim()],
        }));
      }
      setAssigneeInput("");
      assigneeInputRef.current && assigneeInputRef.current.blur();
    }
  }

  // DateRange
  function handleDateChange(type, val) {
    undoStack.current[type] = filters[type];
    setFilters((prev) => ({ ...prev, [type]: val }));
  }

  // Clear whole filter or single value from array
  function clearFilter(field, value = null) {
    if (value !== null) {
      setFilters((prev) => {
        undoStack.current[field] = prev[field];
        return { ...prev, [field]: prev[field].filter((v) => v !== value) };
      });
    } else {
      undoStack.current[field] = filters[field];
      setFilters((prev) =>
        ["dueFrom", "dueTo"].includes(field)
          ? { ...prev, [field]: "" }
          : { ...prev, [field]: [] }
      );
    }
  }

  // Undo per field
  function undoFilter(field) {
    setFilters((prev) => ({
      ...prev,
      [field]: undoStack.current[field] ?? prev[field],
    }));
  }

  // Reset all
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

  // Modern filter chips summary
  function renderActiveChips() {
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
      });
    if (filters.dueTo)
      chips.push({
        label: `Due ≤ ${filters.dueTo}`,
        field: "dueTo",
      });
    return chips;
  }

  // --- UI Layout, grouped and modern ---

  // MINIMALISTIC UI: Compact all filter groups horizontally, remove visual legends/labels on small screens, use simple outlines.
  return (
    <section
      className="kanban-filter-panel"
      aria-label="Kanban Filter Panel"
      role="region"
      style={{ padding: "6px 0 2px 0", minWidth: 0 }}
    >
      {/* Main Filters: Highly compact, chip-style grouping, inline, no verbose descriptions */}
      <form
        className="filter-row"
        spellCheck={false}
        autoComplete="off"
        aria-label="Kanban Filters"
        onSubmit={(e) => e.preventDefault()}
        tabIndex={-1}
        style={{
          gap: "13px",
          flexWrap: "wrap",
          marginBottom: "3px",
          alignItems: "center"
        }}
      >
        {/* Assignees */}
        <div
          className="filter-compact-group"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
            flex: "1 0 168px",
            padding: "0 3px"
          }}
        >
          <span title="Assignee" style={{ color: "#38B2AC", fontSize: "1.14em", paddingBottom: 1, display: "flex", alignItems: "center" }}>👤</span>
          <input
            ref={assigneeInputRef}
            value={assigneeInput}
            onChange={handleAssigneeInput}
            onKeyDown={handleAssigneeKeyDown}
            placeholder="Assignee"
            aria-label="Filter by assignee"
            list="kanban-filter-assignee-options"
            className={"filter-typeahead-input" + (isActive("assignees") ? " active" : "")}
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            style={{ minWidth: 68, fontSize: ".99em", maxWidth: 110, borderRadius: 8, height: 33, marginRight: 4 }}
          />
          <datalist id="kanban-filter-assignee-options">
            {assigneeOptions.map((a) => (
              <option value={a} key={a} />
            ))}
          </datalist>
          <div style={{ display: "flex", gap: 2 }}>
            {filters.assignees.map((a) => (
              <span className="filter-chip" style={{ fontSize: ".99em", padding: "3px 10px", minHeight: "28px" }} key={a}>
                {a}
                <button
                  type="button"
                  onClick={() => clearFilter("assignees", a)}
                  title="Remove"
                  style={{ marginLeft: "2px", padding: "0 4px", fontSize: ".95em" }}
                  tabIndex={0}
                >×</button>
              </span>
            ))}
          </div>
        </div>
        {/* Priority */}
        <div
          className="filter-compact-group"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
            flex: "1 0 124px",
            padding: "0 3px"
          }}
        >
          <span title="Priority" style={{ color: "#ed6644", fontSize: "1.07em", display: "flex", alignItems: "center" }}>⚡</span>
          <select
            multiple
            value={filters.priorities}
            onChange={(e) =>
              handleMultiSelect(
                "priorities",
                Array.from(e.target.selectedOptions, (o) => o.value)
              )
            }
            className={"filter-multiselect" + (isActive("priorities") ? " active" : "")}
            size={1}
            aria-label="Select priorities"
            style={{
              minWidth: 78,
              maxWidth: 104,
              background: "var(--input-bg)",
              fontSize: ".98em",
              color: "var(--base-light)",
              padding: "7px 9px",
              borderRadius: 8,
              height: 33
            }}
          >
            {priorityOptions.map((p) => (
              <option value={p} key={p}>{p}</option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 1 }}>
            {filters.priorities.map((p) => (
              <span className="filter-chip" style={{ fontSize: ".98em", minHeight: 28 }} key={p}>
                {p}
                <button
                  type="button"
                  onClick={() => clearFilter("priorities", p)}
                  title="Remove"
                  style={{ marginLeft: "2px", padding: "0 4px", fontSize: ".95em" }}
                  tabIndex={0}
                >×</button>
              </span>
            ))}
          </div>
        </div>
        {/* Status */}
        <div
          className="filter-compact-group"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
            flex: "1 0 124px",
            padding: "0 3px"
          }}
        >
          <span title="Status" style={{ color: "#72e0d7", fontSize: "1.06em", display: "flex", alignItems: "center" }}>📊</span>
          <select
            multiple
            value={filters.statuses}
            onChange={(e) =>
              handleMultiSelect(
                "statuses",
                Array.from(e.target.selectedOptions, (o) => o.value)
              )
            }
            className={"filter-multiselect" + (isActive("statuses") ? " active" : "")}
            size={1}
            aria-label="Select statuses"
            style={{
              minWidth: 78,
              maxWidth: 104,
              background: "var(--input-bg)",
              fontSize: ".98em",
              color: "var(--color-accent-pastel)",
              padding: "7px 9px",
              borderRadius: 8,
              height: 33
            }}
          >
            {statusOptions.map((s) => (
              <option value={s} key={s}>{s}</option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 1 }}>
            {filters.statuses.map((s) => (
              <span className="filter-chip" style={{ fontSize: ".96em", minHeight: 28 }} key={s}>
                {s}
                <button
                  type="button"
                  onClick={() => clearFilter("statuses", s)}
                  title="Remove"
                  style={{ marginLeft: "2px", padding: "0 4px", fontSize: ".93em" }}
                  tabIndex={0}
                >×</button>
              </span>
            ))}
          </div>
        </div>
        {/* Columns */}
        <div
          className="filter-compact-group"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
            flex: "1 0 118px",
            padding: "0 3px"
          }}
        >
          <span title="Column" style={{ color: "#38B2AC", fontSize: "1.03em", display: "flex", alignItems: "center" }}>📦</span>
          <select
            multiple
            value={filters.columns}
            onChange={(e) =>
              handleMultiSelect(
                "columns",
                Array.from(e.target.selectedOptions, (o) => o.value)
              )
            }
            className={"filter-multiselect" + (isActive("columns") ? " active" : "")}
            size={1}
            aria-label="Select columns"
            style={{
              minWidth: 73,
              maxWidth: 100,
              background: "var(--input-bg)",
              fontSize: ".98em",
              color: "#9ff",
              padding: "7px 7px",
              borderRadius: 8,
              height: 33
            }}
          >
            {columnOptions.map((col) => (
              <option key={col.id} value={col.id}>
                {col.title}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 1 }}>
            {filters.columns.map((c) => (
              <span className="filter-chip" style={{ fontSize: ".97em", minHeight: 28 }} key={c}>
                {(columnOptions.find(o=>o.id===c)?.title) || c}
                <button
                  type="button"
                  onClick={() => clearFilter("columns", c)}
                  title="Remove"
                  tabIndex={0}
                  style={{ marginLeft: "2px", padding: "0 4px", fontSize: ".93em" }}
                >×</button>
              </span>
            ))}
          </div>
        </div>
        {/* Due Date */}
        <div
          className="filter-compact-group"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            minWidth: 0,
            flex: "1 0 132px",
            padding: "0 2px"
          }}
        >
          <span title="Due Date" style={{ color: "#c6fa94", fontSize: "1.01em", paddingBottom: 1, display: "flex", alignItems: "center" }}>🗓️</span>
          <input
            type="date"
            value={filters.dueFrom}
            onChange={(e) => handleDateChange("dueFrom", e.target.value)}
            className={"filter-date" + (filters.dueFrom ? " active" : "")}
            aria-label="Due date from"
            title="Due after or on"
            style={{ minWidth: 69, fontSize: ".93em", borderRadius: 8, height: 32, marginRight: 1 }}
          />
          <span aria-hidden style={{ color: "#888", fontWeight: 400, marginTop: 1, marginLeft: 0 }}>–</span>
          <input
            type="date"
            value={filters.dueTo}
            onChange={(e) => handleDateChange("dueTo", e.target.value)}
            className={"filter-date" + (filters.dueTo ? " active" : "")}
            aria-label="Due date to"
            title="Due before or on"
            style={{ minWidth: 69, fontSize: ".93em", borderRadius: 8, height: 32, marginLeft: 1 }}
          />
        </div>
        {/* Reset All */}
        <button
          type="button"
          className="btn filter-reset-btn"
          aria-label="Reset all filters"
          title="Reset all filter fields to default"
          style={{
            background: "#132944",
            color: "#ff8070",
            fontWeight: 700,
            fontSize: ".96em",
            padding: "7px 14px",
            marginLeft: 9,
            marginTop: "0",
            height: 34,
            minWidth: 68,
            letterSpacing: "0.02em",
            borderRadius: "12px"
          }}
          onClick={resetFilters}
        >
          Reset
        </button>
      </form>
      {/* Chips for currently active filters (all at once, single bar, no extra labels) */}
      <div className="filter-chipbar" role="list" aria-label="Active filter list" style={{
        margin: "1px 0 0 0", gap: "6px", minHeight: "20px", flexWrap: "wrap"
      }}>
        {renderActiveChips().map((chip) => (
          <span role="listitem" className="filter-chip" style={{ fontSize: ".96em", padding: "3px 9px" }} key={chip.label + chip.value}>
            {chip.label}
            <button
              tabIndex={0}
              type="button"
              title="Remove filter"
              aria-label={`Remove ${chip.label}`}
              onClick={() => clearFilter(chip.field, chip.value)}
              style={{ marginLeft: "3px" }}
            >×</button>
          </span>
        ))}
      </div>
    </section>
  );
}
