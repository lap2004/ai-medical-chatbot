import React from "react";
import AddEditUserModal from "@/components/admin/AddEditUserModal";
import DeleteUserModal from "@/components/admin/DeleteUserModal";
import UsersTableCard from "@/components/admin/UsersTableCard";
import { UserRow, Role, Status, exportUsersToCSV } from "@/types/admin";
import {
    listUsers,
    createUser,
    updateUser,
    deleteUser,
} from "@/services/apis/admin";
import { useUserStore } from "@/store/userStore";
import { useTranslation } from "react-i18next";
import { notify } from "@/utils/notify";
const PAGE_SIZE = 5;
export default function UsersTab() {
    const { t } = useTranslation();
    const { userInfo } = useUserStore();
    const [query, setQuery] = React.useState("");
    const [roleFilter, setRoleFilter] = React.useState<Role | "ALL">("ALL");
    const [statusFilter, setStatusFilter] = React.useState<Status | "ALL">("ALL");
    const [page, setPage] = React.useState(1);
    const [rows, setRows] = React.useState<UserRow[]>([]);
    const [total, setTotal] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [addOpen, setAddOpen] = React.useState(false);
    const [editOpen, setEditOpen] = React.useState(false);
    const [deleteOpen, setDeleteOpen] = React.useState(false);
    const [activeRow, setActiveRow] = React.useState<UserRow | null>(null);
    const [form, setForm] = React.useState<{
        name: string;
        email: string;
        password?: string;
        role: Role;
        status: Status;
    }>({ name: "", email: "", password: "", role: "USER", status: "Active" });
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const fetchUsers = React.useCallback(
        async (p = page) => {
            setLoading(true);
            setError(null);
            try {
                const res = await listUsers({
                    q: query || undefined,
                    role: roleFilter === "ALL" ? undefined : roleFilter,
                    status: statusFilter === "ALL" ? undefined : statusFilter,
                    page: p,
                    page_size: PAGE_SIZE,
                });
                setTotal(res.total);
                setRows(
                    res.items.map((u) => ({
                        id: `#${u.id}`,
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        status: u.status,
                        createdAt: u.created_at,
                        avatarUrl: u.avatar_url ? `${import.meta.env.VITE_API_BACKEND_DOMAIN || ""}${u.avatar_url}` : undefined,
                    }))
                );
            } catch (e: any) {
                setError(e?.response?.data?.detail ?? t('admin.users.failedToLoad', "Failed to load users."));
            } finally {
                setLoading(false);
            }
        },
        [query, roleFilter, statusFilter, page]
    );
    React.useEffect(() => {
        fetchUsers(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, roleFilter, statusFilter, page]);
    const searchTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleQueryChange = (v: string) => {
        setQuery(v);
        setPage(1);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
    const openAdd = () => {
        setForm({ name: "", email: "", password: "", role: "USER", status: "Active" });
        setAddOpen(true);
    };
    const submitAdd = async () => {
        if (!form.name.trim() || !form.email.trim() || !form.password) return;
        setSaving(true);
        setError(null);
        try {
            await createUser({
                full_name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
                is_admin: form.role === "ADMIN",
                is_active: form.status === "Active",
            });
            setAddOpen(false);
            setPage(1);
            fetchUsers(1);
            notify(
                t('admin.users.userCreated', 'User Created'),
                t('admin.users.userCreatedDesc', { name: form.name.trim(), defaultValue: `Successfully created user ${form.name.trim()}` }),
                'success'
            );
        } catch (e: any) {
            const errorMsg = e?.response?.data?.detail ?? t('admin.users.failedToCreate', "Failed to create user.");
            setError(errorMsg);
            notify(t('admin.users.createFailed', 'Creation Failed'), errorMsg, 'error');
        } finally {
            setSaving(false);
        }
    };
    const openEdit = (r: UserRow) => {
        setActiveRow(r);
        setForm({ name: r.name, email: r.email, role: r.role, status: r.status });
        setEditOpen(true);
    };
    const submitEdit = async () => {
        if (!activeRow || !form.name.trim() || !form.email.trim()) return;
        const numericId = parseInt(activeRow.id.replace("#", ""), 10);
        setSaving(true);
        setError(null);
        try {
            await updateUser(numericId, {
                full_name: form.name.trim(),
                email: form.email.trim(),
                is_admin: form.role === "ADMIN",
                is_active: form.status === "Active",
            });
            setEditOpen(false);
            setActiveRow(null);
            fetchUsers(page);
            notify(
                t('admin.users.userUpdated', 'User Updated'),
                t('admin.users.userUpdatedDesc', { name: form.name.trim(), defaultValue: `Successfully updated user ${form.name.trim()}` }),
                'success'
            );
        } catch (e: any) {
            const errorMsg = e?.response?.data?.detail ?? t('admin.users.failedToUpdate', "Failed to update user.");
            setError(errorMsg);
            notify(t('admin.users.updateFailed', 'Update Failed'), errorMsg, 'error');
        } finally {
            setSaving(false);
        }
    };
    const openDelete = (r: UserRow) => {
        setActiveRow(r);
        setDeleteOpen(true);
    };
    const confirmDelete = async () => {
        if (!activeRow) return;
        const numericId = parseInt(activeRow.id.replace("#", ""), 10);
        setSaving(true);
        setError(null);
        try {
            await deleteUser(numericId);
            setDeleteOpen(false);
            setActiveRow(null);
            const newTotal = total - 1;
            const newTotalPages = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
            const newPage = Math.min(page, newTotalPages);
            setPage(newPage);
            fetchUsers(newPage);
            notify(
                t('admin.users.userDeleted', 'User Deleted'),
                t('admin.users.userDeletedDesc', { name: activeRow.name, defaultValue: `Successfully deleted user ${activeRow.name}` }),
                'success'
            );
        } catch (e: any) {
            const errorMsg = e?.response?.data?.detail ?? t('admin.users.failedToDelete', "Failed to delete user.");
            setError(errorMsg);
            notify(t('admin.users.deleteFailed', 'Delete Failed'), errorMsg, 'error');
        } finally {
            setSaving(false);
        }
    };
    return (
        <>
            {/* Error Banner */}
            {error && (
                <div className="mb-3 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-[12px] text-red-600 font-semibold flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
                </div>
            )}
            {/* Loading Overlay */}
            {loading && (
                <div className="mb-2 text-[11px] text-slate-400 font-semibold animate-pulse">
                    {t('admin.users.loadingUsers', 'Loading users...')}
                </div>
            )}
            <UsersTableCard
                query={query}
                onQueryChange={(v) => { handleQueryChange(v); }}
                roleFilter={roleFilter}
                onRoleFilterChange={(v) => { setRoleFilter(v); setPage(1); }}
                statusFilter={statusFilter}
                onStatusFilterChange={(v) => { setStatusFilter(v); setPage(1); }}
                onResetFilters={() => { setRoleFilter("ALL"); setStatusFilter("ALL"); setPage(1); }}
                onExport={() => exportUsersToCSV(rows)}
                onOpenAdd={openAdd}
                rows={rows}
                page={page}
                pageSize={PAGE_SIZE}
                totalPages={totalPages}
                totalItems={total}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                onGoToPage={(p) => setPage(p)}
                onEdit={openEdit}
                onDelete={openDelete}
                currentUserId={userInfo?.id}
            />
            {/* Modals */}
            <AddEditUserModal
                mode="add"
                open={addOpen}
                title={t('admin.users.addNewUserTitle', "Add New User")}
                subtitle={t('admin.users.addNewUserDesc', "Create a new account for the system")}
                form={form}
                setForm={setForm}
                onClose={() => setAddOpen(false)}
                onSubmit={submitAdd}
                submitLabel={t('admin.users.create', "Create")}
                loading={saving}
            />
            <AddEditUserModal
                mode="edit"
                open={editOpen}
                title={t('admin.users.editUserTitle', "Edit User")}
                subtitle={activeRow ? t('admin.users.editUserDesc', { name: activeRow.name, defaultValue: `Editing ${activeRow.name}` }) : undefined}
                form={form}
                setForm={setForm}
                onClose={() => setEditOpen(false)}
                onSubmit={submitEdit}
                submitLabel={t('admin.users.save', "Save")}
                loading={saving}
            />
            <DeleteUserModal
                open={deleteOpen}
                name={activeRow?.name}
                onClose={() => setDeleteOpen(false)}
                onConfirm={confirmDelete}
            />
        </>
    );
}
