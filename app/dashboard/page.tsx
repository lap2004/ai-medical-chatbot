import AddEditUserModal from "@/components/admin/AddEditUserModal";
import AdminLayout from "@/components/admin/AdminLayout";
import DeleteUserModal from "@/components/admin/DeleteUserModal";
import GrowthChartCard from "@/components/admin/GrowthChartCard";
import MetricsGrid from "@/components/admin/MetricsGrid";
import UsersTableCard from "@/components/admin/UsersTableCard";
import { MOCK_USERS, CHART_DATA } from "@/data";
import { NavKey, UserRow, Role, Status, exportUsersToCSV } from "@/types/admin";
import React from "react";
import { useNavigate } from "react-router-dom";

export default function UserManagementDashboard() {
  const navigate = useNavigate();

  const [nav, setNav] = React.useState<NavKey>("users");

  // table state
  const [rows, setRows] = React.useState<UserRow[]>(MOCK_USERS);
  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<Role | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = React.useState<Status | "ALL">("ALL");

  // pagination
  const [page, setPage] = React.useState(1);
  const pageSize = 5;

  // modals
  const [addOpen, setAddOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [activeRow, setActiveRow] = React.useState<UserRow | null>(null);

  // form
  const [form, setForm] = React.useState<{
    name: string;
    email: string;
    role: Role;
    status: Status;
  }>({ name: "", email: "", role: "USER", status: "Active" });

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q);

      const matchRole = roleFilter === "ALL" ? true : r.role === roleFilter;
      const matchStatus =
        statusFilter === "ALL" ? true : r.status === statusFilter;

      return matchQuery && matchRole && matchStatus;
    });
  }, [rows, query, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  React.useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pageRows = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const handleLogout = () => navigate("/");

  // actions
  const openAdd = () => {
    setForm({ name: "", email: "", role: "USER", status: "Active" });
    setAddOpen(true);
  };

  const submitAdd = () => {
    if (!form.name.trim() || !form.email.trim()) return;

    const next: UserRow = {
      id: `#${Math.floor(4800 + Math.random() * 500)}`,
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      status: form.status,
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      avatarUrl:
        "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=64&h=64&fit=crop&crop=faces",
    };

    setRows((prev) => [next, ...prev]);
    setAddOpen(false);
    setPage(1);
  };

  const openEdit = (r: UserRow) => {
    setActiveRow(r);
    setForm({ name: r.name, email: r.email, role: r.role, status: r.status });
    setEditOpen(true);
  };

  const submitEdit = () => {
    if (!activeRow) return;
    if (!form.name.trim() || !form.email.trim()) return;

    setRows((prev) =>
      prev.map((r) =>
        r.id === activeRow.id
          ? {
              ...r,
              name: form.name.trim(),
              email: form.email.trim(),
              role: form.role,
              status: form.status,
            }
          : r,
      ),
    );

    setEditOpen(false);
    setActiveRow(null);
  };

  const openDelete = (r: UserRow) => {
    setActiveRow(r);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!activeRow) return;
    setRows((prev) => prev.filter((r) => r.id !== activeRow.id));
    setDeleteOpen(false);
    setActiveRow(null);
  };

  return (
    <AdminLayout nav={nav} setNav={setNav} onLogout={handleLogout}>
      <div className="px-7 py-6">
        <MetricsGrid />

        <div className="mt-4">
          <GrowthChartCard data={CHART_DATA} />
        </div>

        <div className="mt-4">
          <UsersTableCard
            query={query}
            onQueryChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            roleFilter={roleFilter}
            onRoleFilterChange={(v) => {
              setRoleFilter(v);
              setPage(1);
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            onResetFilters={() => {
              setRoleFilter("ALL");
              setStatusFilter("ALL");
              setPage(1);
            }}
            onExport={() => exportUsersToCSV(filtered)}
            onOpenAdd={openAdd}
            rows={pageRows}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalItems={filtered.length}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            onGoToPage={(p) => setPage(p)}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        </div>

        <div className="text-center text-[10px] text-slate-300 mt-8">
          © 2026 AI Doctor Assistant Management System. All rights reserved.
        </div>
      </div>

      {/* Modals */}
      <AddEditUserModal
        mode="add"
        open={addOpen}
        title="Add New User"
        subtitle="Create a new account for the system"
        form={form}
        setForm={setForm}
        onClose={() => setAddOpen(false)}
        onSubmit={submitAdd}
        submitLabel="Create"
      />

      <AddEditUserModal
        mode="edit"
        open={editOpen}
        title="Edit User"
        subtitle={activeRow ? `Editing ${activeRow.name}` : undefined}
        form={form}
        setForm={setForm}
        onClose={() => setEditOpen(false)}
        onSubmit={submitEdit}
        submitLabel="Save"
      />

      <DeleteUserModal
        open={deleteOpen}
        name={activeRow?.name}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </AdminLayout>
  );
}
