import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import Badge from "../ui/Badge";
import StatusDot from "../ui/StatusDot";
import { UserRow } from "@/types/admin";

export default function UsersTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: UserRow[];
  onEdit: (r: UserRow) => void;
  onDelete: (r: UserRow) => void;
}) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="text-[10px] uppercase tracking-widest text-slate-400">
          <th className="text-left font-extrabold py-3">ID</th>
          <th className="text-left font-extrabold py-3">User</th>
          <th className="text-left font-extrabold py-3">Email</th>
          <th className="text-left font-extrabold py-3">Role</th>
          <th className="text-left font-extrabold py-3">Status</th>
          <th className="text-left font-extrabold py-3">Created Date</th>
          <th className="text-right font-extrabold py-3">Actions</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-t border-slate-100 text-[12px]">
            <td className="py-3 text-slate-500 font-semibold">{r.id}</td>

            <td className="py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                  {r.avatarUrl ? (
                    <img
                      src={r.avatarUrl}
                      alt={r.name}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="font-extrabold text-slate-900">{r.name}</div>
              </div>
            </td>

            <td className="py-3 text-slate-500 font-semibold">{r.email}</td>

            <td className="py-3">
              <Badge tone={r.role === "ADMIN" ? "blue" : "slate"}>
                {r.role}
              </Badge>
            </td>

            <td className="py-3">
              <StatusDot status={r.status} />
            </td>

            <td className="py-3 text-slate-500 font-semibold">{r.createdAt}</td>

            <td className="py-3">
              <div className="flex items-center justify-end gap-2">
                <button
                  className="p-2 rounded-lg hover:bg-slate-50"
                  onClick={() => onEdit(r)}
                  title="Edit"
                >
                  <Pencil className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  className="p-2 rounded-lg hover:bg-slate-50"
                  onClick={() => onDelete(r)}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </td>
          </tr>
        ))}

        {rows.length === 0 && (
          <tr>
            <td
              colSpan={7}
              className="py-10 text-center text-[12px] text-slate-400"
            >
              No users found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
