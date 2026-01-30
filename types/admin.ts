export type Role = "ADMIN" | "DOCTOR" | "USER";
export type Status = "Active" | "Inactive";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  createdAt: string;
  avatarUrl?: string;
};

export type NavKey = "dashboard" | "users" | "analytics" | "settings";

export function clsx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

export function exportUsersToCSV(rows: UserRow[]) {
  const header = ["ID", "Name", "Email", "Role", "Status", "CreatedAt"];
  const body = rows.map((r) => [
    r.id,
    r.name,
    r.email,
    r.role,
    r.status,
    r.createdAt,
  ]);

  const csv = [header, ...body]
    .map((line) =>
      line
        .map((cell) => {
          const s = String(cell ?? "");
          const escaped = s.replaceAll('"', '""');
          return `"${escaped}"`;
        })
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "users.csv";
  a.click();
  URL.revokeObjectURL(url);
}
