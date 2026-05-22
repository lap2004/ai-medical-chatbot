import { Role, UserRow } from "@/types/admin";
export const MOCK_USERS: UserRow[] = [
  {
    id: "#4829",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@ai.com",
    role: "ADMIN",
    status: "Active",
    createdAt: "Oct 24, 2023",
    avatarUrl:
      "https:
  },
  {
    id: "#4830",
    name: "David Chen",
    email: "d.chen@health.ai",
    role: "DOCTOR",
    status: "Active",
    createdAt: "Nov 12, 2023",
    avatarUrl:
      "https:
  },
  {
    id: "#4831",
    name: "Elena Rodriguez",
    email: "elena.r@clinic.com",
    role: "USER",
    status: "Inactive",
    createdAt: "Dec 01, 2023",
    avatarUrl:
      "https:
  },
  ...Array.from({ length: 22 }).map((_, i) => ({
    id: `#48${32 + i}`,
    name: `User ${i + 4}`,
    email: `user${i + 4}@example.com`,
    role: (i % 3 === 0 ? "ADMIN" : i % 3 === 1 ? "DOCTOR" : "USER") as Role,
    status: (i % 4 === 0 ? "Inactive" : "Active") as any,
    createdAt: "Dec 01, 2023",
  })),
];
export const CHART_DATA = [
  { w: "Week 1", v: 2200 },
  { w: " ", v: 3500 },
  { w: " ", v: 3000 },
  { w: "Week 2", v: 3800 },
  { w: " ", v: 2600 },
  { w: " ", v: 3300 },
  { w: "Week 3", v: 2100 },
  { w: " ", v: 4400 },
  { w: " ", v: 3200 },
  { w: "Week 4", v: 4200 },
];
