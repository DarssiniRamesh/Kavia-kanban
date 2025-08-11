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

/**
 * PUBLIC_INTERFACE
 * Minimal, dropdown-list, multi-select filter panel for Kanban board.
 * Filters: assignee, status, priority, and column—all use dropdown multi-selects with compact chips for selected options.
 */
export default function FilterPanel({ onFiltersChange }) {
  const { cards, columns } = useKanban();

  // Filter state: keys based on field names
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

  // Build unique option lists for dropdowns (from cards or columns)
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

  // Handler for dropdown multi-selects (all fields apply same logic)
  const handleMultiSelect = (field) => (event) => {
    const values = Array.from(event.target.selectedOptions).map((o) => o.value);
    setFilters((prev) => ({
      ...prev,
      [field]: values
    }));
  };

  // Handler to clear a filter field, or a single value if provided
  const clearFilter = (field, value = null) => {
    if (value !== null) {
      setFilters((prev) => ({
        ...prev,
        [field]: prev[field].filter((v) => v !== value),
      }));
    } else {
      setFilters((prev) =>
        ["dueFrom", "dueTo"].includes(field)
          ? { ...prev, [field]: "" }
          : { ...prev, [field]: [] }
      );
    }
  };

  // Reset all fields
  const resetFilters = () => {
    setFilters({
      assignees: [],
      priorities: [],
      statuses: [],
      columns: [],
      dueFrom: "",
      dueTo: ""
    });
  };

  // Date filter change
  const handleDateChange = (type, val) => {
    setFilters((prev) => ({ ...prev, [type]: val }));
  };

  // Render all selected filter badges
  function renderActiveChips() {
    const chips = [];
    filters.assignees.forEach((a) =>
      chips.push({ label: a, field: "assignees", value: a })
    );
    filters.priorities.forEach((p) =>
      chips.push({ label: p, field: "priorities", value: p })
    );
    filters.statuses.forEach((s) =>
      chips.push({ label: s, field: "statuses", value: s })
    );
    filters.columns.forEach((colId) => {
      const col = columnOptions.find((c) => c.id === colId);
      chips.push({ label: col ? col.title : colId, field: "columns", value: colId });
    });
    if (filters.dueFrom)
      chips.push({ label: `Due ≥ ${filters.dueFrom}`, field: "dueFrom" });
    if (filters.dueTo)
      chips.push({ label: `Due ≤ ${filters.dueTo}`, field: "dueTo" });
    return chips;
  }

  // Helper: mark an input as active if it has selections or values
  const isActive = (field) => {
    if (["dueFrom", "dueTo"].includes(field)) return !!filters[field];
    return Array.isArray(filters[field]) && filters[field].length > 0;
  };

  // Minimal, visually unified form layout (all dropdowns = multi-select with dropdown UI)
  return (
    <section
      className="kanban-filter-panel"
      aria-label="Kanban Filter Panel"
      role="region"
      style={{ padding: "6px 0 2px 0", minWidth: 0 }}
    >
      <form
        className="filter-row"
        onSubmit={e => e.preventDefault()}
        spellCheck={false}
        autoComplete="off"
        aria-label="Kanban Filters"
        style={{
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "3px",
          alignItems: "center",
          minWidth: 0
        }}
      >
        {/* ASSIGNEE multi-select */}
        <div className="filter-compact-group" style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span title="Assignee" aria-label="Assignees" style={{ color: "#38B2AC" }}>👤</span>
          <select
            multiple
            value={filters.assignees}
            onChange={handleMultiSelect("assignees")}
            className={"filter-multiselect" + (isActive("assignees") ? " active" : "")}
            size={1}
            aria-label="Select assignee(s)"
            style={{
              minWidth: 85,
              maxWidth: 120,
              fontSize: ".98em",
              borderRadius: 8,
              padding: "6px 8px"
            }}
          >
            {assigneeOptions.map((a) => (
              <option value={a} key={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* PRIORITY multi-select */}
        <div className="filter-compact-group" style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span title="Priority" aria-label="Priority" style={{ color: "#ed6644" }}>⚡</span>
          <select
            multiple
            value={filters.priorities}
            onChange={handleMultiSelect("priorities")}
            className={"filter-multiselect" + (isActive("priorities") ? " active" : "")}
            size={1}
            aria-label="Select priorities"
            style={{ minWidth: 75, maxWidth: 105, fontSize: ".98em", borderRadius: 8, padding: "6px 8px" }}
          >
            {priorityOptions.map((p) => (
              <option value={p} key={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* STATUS multi-select */}
        <div className="filter-compact-group" style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span title="Status" aria-label="Status" style={{ color: "#72e0d7" }}>📊</span>
          <select
            multiple
            value={filters.statuses}
            onChange={handleMultiSelect("statuses")}
            className={"filter-multiselect" + (isActive("statuses") ? " active" : "")}
            size={1}
            aria-label="Select statuses"
            style={{ minWidth: 77, maxWidth: 110, fontSize: ".98em", borderRadius: 8, padding: "6px 8px" }}
          >
            {statusOptions.map((s) => (
              <option value={s} key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* COLUMN multi-select */}
        <div className="filter-compact-group" style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span title="Column" aria-label="Column" style={{ color: "#38B2AC" }}>📦</span>
          <select
            multiple
            value={filters.columns}
            onChange={handleMultiSelect("columns")}
            className={"filter-multiselect" + (isActive("columns") ? " active" : "")}
            size={1}
            aria-label="Select columns"
            style={{ minWidth: 74, maxWidth: 105, fontSize: ".98em", borderRadius: 8, padding: "6px 8px" }}
          >
            {columnOptions.map((col) => (
              <option key={col.id} value={col.id}>
                {col.title}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date Range */}
        <div className="filter-compact-group" style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
          <span title="Due Date" aria-label="Due Date" style={{ color: "#c6fa94" }}>🗓️</span>
          <input
            type="date"
            value={filters.dueFrom}
            onChange={e => handleDateChange("dueFrom", e.target.value)}
            className={"filter-date" + (filters.dueFrom ? " active" : "")}
            aria-label="Due date from"
            style={{ minWidth: 69, fontSize: ".93em", borderRadius: 8, height: 32, marginRight: 1 }}
          />
          <span aria-hidden style={{ color: "#888", fontWeight: 400, marginTop: 1, marginLeft: 0 }}>–</span>
          <input
            type="date"
            value={filters.dueTo}
            onChange={e => handleDateChange("dueTo", e.target.value)}
            className={"filter-date" + (filters.dueTo ? " active" : "")}
            aria-label="Due date to"
            style={{ minWidth: 69, fontSize: ".93em", borderRadius: 8, height: 32, marginLeft: 1 }}
          />
        </div>

        {/* Reset Button */}
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
      {/* Render all active chips/badges in a compact way */}
      <div className="filter-chipbar" role="list" aria-label="Active filter list" style={{
        margin: "1px 0 0 0",
        gap: "5px",
        minHeight: "18px",
        flexWrap: "wrap"
      }}>
        {renderActiveChips().map((chip) => (
          <span
            role="listitem"
            className="filter-chip"
            key={chip.label + String(chip.value)}
            style={{ fontSize: ".94em", padding: "2px 9px", minHeight: 22 }}
          >
            {chip.label}
            <button
              tabIndex={0}
              type="button"
              title="Remove filter"
              aria-label={`Remove ${chip.label}`}
              onClick={() => clearFilter(chip.field, chip.value)}
              style={{ marginLeft: "4px", fontSize: ".95em" }}
            >×</button>
          </span>
        ))}
      </div>
    </section>
  );
}
