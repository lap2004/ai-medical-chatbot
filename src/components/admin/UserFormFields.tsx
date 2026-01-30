import { Role, Status } from "@/types/admin";
import React from "react";

export default function UserFormFields({
  form,
  setForm,
}: {
  form: { name: string; email: string; role: Role; status: Status };
  setForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
      role: Role;
      status: Status;
    }>
  >;
}) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
          Name
        </div>
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-100 text-[12px] font-semibold"
          placeholder="Full name"
        />
      </div>

      <div>
        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
          Email
        </div>
        <input
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-100 text-[12px] font-semibold"
          placeholder="email@example.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
            Role
          </div>
          <select
            value={form.role}
            onChange={(e) =>
              setForm((p) => ({ ...p, role: e.target.value as Role }))
            }
            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[12px] font-semibold"
          >
            <option value="ADMIN">Admin</option>
            <option value="DOCTOR">Doctor</option>
            <option value="USER">User</option>
          </select>
        </div>

        <div>
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
            Status
          </div>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((p) => ({ ...p, status: e.target.value as Status }))
            }
            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[12px] font-semibold"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>
    </div>
  );
}
