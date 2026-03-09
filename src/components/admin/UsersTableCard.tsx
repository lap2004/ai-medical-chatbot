import { Role, Status, UserRow } from "@/types/admin";
import React from "react";
import PaginationFooter from "./PaginationFooter";
import UsersTable from "./UsersTable";
import UsersToolbar from "./UsersToolbar";

export default function UsersTableCard(props: {
  query: string;
  onQueryChange: (v: string) => void;

  roleFilter: Role | "ALL";
  onRoleFilterChange: (v: Role | "ALL") => void;

  statusFilter: Status | "ALL";
  onStatusFilterChange: (v: Status | "ALL") => void;

  onResetFilters: () => void;
  onExport: () => void;
  onOpenAdd: () => void;

  rows: UserRow[];

  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  onPrev: () => void;
  onNext: () => void;
  onGoToPage: (p: number) => void;

  onEdit: (r: UserRow) => void;
  onDelete: (r: UserRow) => void;
  currentUserId?: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white">
      <UsersToolbar
        query={props.query}
        onQueryChange={props.onQueryChange}
        roleFilter={props.roleFilter}
        onRoleFilterChange={props.onRoleFilterChange}
        statusFilter={props.statusFilter}
        onStatusFilterChange={props.onStatusFilterChange}
        onReset={props.onResetFilters}
        onExport={props.onExport}
        onOpenAdd={props.onOpenAdd}
      />

      <div className="px-4 pb-3">
        <UsersTable
          rows={props.rows}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
          currentUserId={props.currentUserId}
        />
        <PaginationFooter
          page={props.page}
          pageSize={props.pageSize}
          totalPages={props.totalPages}
          totalItems={props.totalItems}
          onPrev={props.onPrev}
          onNext={props.onNext}
          onGoToPage={props.onGoToPage}
        />
      </div>
    </div>
  );
}
