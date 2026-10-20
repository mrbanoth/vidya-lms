import { Link } from "react-router";
import { Check, Minus } from "lucide-react";
import { Button, Card, PageHeader } from "@/components/ui";
import { useTitle } from "@/hooks/useTitle";

const ROLES = ["Guest", "Student", "Instructor", "Admin"];

// Mirrors the server's authenticate/authorize rules (see docs/ROLES_AND_ROUTES.md).
const MATRIX = [
  ["Browse catalog, courses and instructor profiles", [1, 1, 1, 1]],
  ["Verify and download certificates", [1, 1, 1, 1]],
  ["Checkout and enroll", [0, 1, 1, 1]],
  ["Learn enrolled courses: lessons, quizzes, notes, Q&A", [0, 1, 1, 1]],
  ["Review a course (enrolled learners)", [0, 1, 1, 1]],
  ["Orders and refund requests", [0, 1, 1, 1]],
  ["Create and edit own courses", [0, 0, 1, 1]],
  ["Answer Q&A, see students, reviews and earnings", [0, 0, 1, 1]],
  ["Request payouts", [0, 0, 1, 1]],
  ["Approve or reject courses", [0, 0, 0, 1]],
  ["Manage users, roles and bans", [0, 0, 0, 1]],
  ["Payments, refunds, payouts and coupons", [0, 0, 0, 1]],
  ["Categories, reports, audit log and settings", [0, 0, 0, 1]],
  ["Use the site during maintenance", [0, 0, 0, 1]],
];

const DESC = {
  Guest: "Visitors who are not signed in.",
  Student: "Default role for every new account.",
  Instructor: "Creates and sells courses; can also learn.",
  Admin: "Runs the platform; can edit any course.",
};

export default function Roles() {
  useTitle("Roles & permissions");
  return (
    <>
      <PageHeader
        title="Roles & permissions"
        description="What each role can do. Permissions are enforced by the API; change a person's role from Users."
        actions={<Button asChild><Link to="/admin/users">Manage users</Link></Button>}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((r) => (
          <Card key={r} className="grid gap-1 p-4"><b>{r}</b><span className="text-sm text-muted-foreground">{DESC[r]}</span></Card>
        ))}
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3 font-semibold">Permission</th>{ROLES.map((r) => <th key={r} className="px-4 py-3 text-center font-semibold">{r}</th>)}</tr>
          </thead>
          <tbody>
            {MATRIX.map(([label, allowed]) => (
              <tr key={label} className="border-t border-border">
                <td className="px-4 py-3">{label}</td>
                {allowed.map((ok, i) => (
                  <td key={ROLES[i]} className="px-4 py-3 text-center">
                    {ok ? <Check className="mx-auto size-4 text-success" aria-label="Allowed" /> : <Minus className="mx-auto size-4 text-muted-foreground/50" aria-label="Not allowed" />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
