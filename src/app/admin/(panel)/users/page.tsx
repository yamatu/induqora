import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { changePassword, createUser, deleteUser } from "../../actions";
import { ActionForm } from "../ActionForm";

export const metadata = { title: "Users & security" };

export default async function UsersAdmin() {
  const session = await requireUser();
  const isAdmin = session.role === "ADMIN";
  const users = isAdmin ? await db.adminUser.findMany({ orderBy: { createdAt: "asc" } }) : [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-ink">Users & security</h1>

      <section className="max-w-md rounded-lg border border-line bg-white p-5">
        <h2 className="mb-4 font-semibold text-ink">Change your password</h2>
        <ActionForm action={changePassword} submitLabel="Update password">
          <div>
            <label htmlFor="current" className="label">
              Current password
            </label>
            <input id="current" name="current" type="password" required autoComplete="current-password" className="input" />
          </div>
          <div>
            <label htmlFor="next" className="label">
              New password (12+ characters)
            </label>
            <input id="next" name="next" type="password" required minLength={12} autoComplete="new-password" className="input" />
          </div>
        </ActionForm>
      </section>

      {isAdmin && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="overflow-x-auto rounded-lg border border-line bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-paper text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Last sign-in</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{u.name}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">{u.role}</td>
                    <td className="px-4 py-3 text-muted">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}</td>
                    <td className="px-4 py-3 text-right">
                      {u.id !== session.sub && (
                        <form action={deleteUser}>
                          <input type="hidden" name="id" value={u.id} />
                          <button type="submit" className="cursor-pointer text-red-600 hover:underline">
                            Remove
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="mb-4 font-semibold text-ink">Add user</h2>
            <ActionForm action={createUser} submitLabel="Create user">
              <div>
                <label htmlFor="u-name" className="label">
                  Name
                </label>
                <input id="u-name" name="name" required className="input" />
              </div>
              <div>
                <label htmlFor="u-email" className="label">
                  Email
                </label>
                <input id="u-email" name="email" type="email" required className="input" />
              </div>
              <div>
                <label htmlFor="u-password" className="label">
                  Temporary password (12+ characters)
                </label>
                <input id="u-password" name="password" type="password" required minLength={12} autoComplete="new-password" className="input" />
              </div>
              <div>
                <label htmlFor="u-role" className="label">
                  Role
                </label>
                <select id="u-role" name="role" className="input" defaultValue="EDITOR">
                  <option value="EDITOR">Editor — manage content</option>
                  <option value="ADMIN">Admin — content and users</option>
                </select>
              </div>
            </ActionForm>
          </section>
        </div>
      )}
    </div>
  );
}
