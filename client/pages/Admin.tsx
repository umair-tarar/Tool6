import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/lib/supabase";

type AccessStatus = "pending" | "approved" | "rejected" | "revoked";
type Activity = { action: string; created_at: string };
type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  access_status: AccessStatus;
  created_at: string;
  credits: { used: number; remaining: number } | null;
  activity: Activity[];
};

export default function Admin() {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [updatingAccessUserId, setUpdatingAccessUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && profile?.role !== "admin") navigate("/dashboard", { replace: true });
  }, [loading, profile, navigate]);

  useEffect(() => {
    if (profile?.role !== "admin") return;

    const loadUsers = async () => {
      const [
        { data: profiles, error: profilesError },
        { data: credits, error: creditsError },
        { data: loginActivity, error: loginActivityError },
        { data: resetActivity, error: resetActivityError },
      ] = await Promise.all([
        supabase.from("profiles").select("id,email,full_name,role,access_status,created_at").order("created_at", { ascending: false }),
        supabase.from("credits").select("user_id,used,remaining"),
        supabase.from("login_activity").select("user_id,action,created_at").order("created_at", { ascending: false }),
        supabase.from("credit_reset_activity").select("target_user_id,action,created_at").order("created_at", { ascending: false }),
      ]);

      if (profilesError || creditsError || loginActivityError || resetActivityError) {
        const error = profilesError || creditsError || loginActivityError || resetActivityError;
        console.error("Failed to load admin data", error);
        setErrorMessage(error?.message ?? "Unable to load admin data.");
        return;
      }

      const creditMap = new Map((credits ?? []).map((credit) => [credit.user_id, credit]));
      const activityMap = new Map<string, Activity[]>();
      (loginActivity ?? []).forEach((event) => {
        activityMap.set(event.user_id, [...(activityMap.get(event.user_id) ?? []), { action: event.action, created_at: event.created_at }]);
      });
      (resetActivity ?? []).forEach((event) => {
        activityMap.set(event.target_user_id, [...(activityMap.get(event.target_user_id) ?? []), { action: event.action, created_at: event.created_at }]);
      });
      activityMap.forEach((events, userId) => {
        activityMap.set(userId, events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      });
      setUsers((profiles ?? []).map((user) => ({
        ...user,
        credits: creditMap.get(user.id) ?? null,
        activity: activityMap.get(user.id) ?? [],
      })));
    };

    loadUsers();
  }, [profile]);

  const updateAccess = async (userId: string, status: Exclude<AccessStatus, "pending">) => {
    const confirmation = {
      approved: "Approve access for this user?",
      rejected: "Reject access for this user?",
      revoked: "Revoke access for this user?",
    }[status];
    if (!window.confirm(confirmation)) return;

    setErrorMessage("");
    setUpdatingAccessUserId(userId);
    const { data, error } = await supabase.rpc("manage_user_access", { target_user_id: userId, new_status: status });
    setUpdatingAccessUserId(null);

    if (error) {
      console.error("Failed to update user access", { userId, status, error });
      setErrorMessage(error.message);
      return;
    }

    if (!data) {
      setErrorMessage("The access function did not return updated profile data.");
      return;
    }

    setUsers((currentUsers) => currentUsers.map((user) => (
      user.id === userId
        ? { ...user, access_status: data.access_status, activity: [{ action: `access_${status}`, created_at: new Date().toISOString() }, ...user.activity] }
        : user
    )));
  };

  const resetCredits = async (userId: string) => {
    if (!window.confirm("Reset credits for this user? Their credits will be restored to 200,000.")) return;

    setErrorMessage("");
    setResettingUserId(userId);
    const { data, error } = await supabase.rpc("reset_user_credits", { target_user_id: userId });
    setResettingUserId(null);

    if (error) {
      console.error("Failed to reset user credits", { userId, error });
      setErrorMessage(error.message);
      return;
    }

    if (!data) {
      const message = "The reset function did not return updated credit data.";
      console.error("Failed to reset user credits", { userId, message });
      setErrorMessage(message);
      return;
    }

    setUsers((currentUsers) => currentUsers.map((user) => (
      user.id === userId ? { ...user, credits: { used: data.used, remaining: data.remaining } } : user
    )));
  };

  if (loading || profile?.role !== "admin") {
    return <main className="grid min-h-screen place-items-center bg-[#f7f9fc] text-sm text-[#71809d]">Checking access...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#17223b]">
      <header className="bg-gradient-to-r from-[#263bd0] to-[#182a9f] px-5 py-5 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15"><ShieldCheck size={20} /></span>
            <div>
              <p className="text-sm font-extrabold">Admin Dashboard</p>
              <p className="text-[11px] text-blue-200">Admin-only user access and credit activity</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <Link to="/dashboard" className="flex items-center gap-1 rounded-lg px-3 py-2 hover:bg-white/10"><ArrowLeft size={14} /> Back to Workspace</Link>
            <button onClick={() => supabase.auth.signOut().then(() => navigate("/login"))} className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20"><LogOut size={14} /> Log out</button>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl p-5 sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-semibold text-[#71809d]">Overview</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">All users</h1>
        </div>
        {errorMessage && <p role="alert" className="mb-5 rounded-lg bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{errorMessage}</p>}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-slate-200 bg-[#f7f9ff] text-[10px] uppercase tracking-wider text-[#71809d]">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Access Status</th>
                <th className="px-5 py-4">Joined</th>
                <th className="px-5 py-4">Credits used</th>
                <th className="px-5 py-4">Remaining</th>
                <th className="px-5 py-4">Latest activity</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const latest = user.activity[0];
                const isResetting = resettingUserId === user.id;
                const isUpdatingAccess = updatingAccessUserId === user.id;
                const isSelf = user.id === profile.id;
                return (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-bold text-[#243653]">{user.full_name || "Unnamed user"}</td>
                    <td className="px-5 py-4 text-[#71809d]">{user.email}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${user.role === "admin" ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"}`}>{user.role}</span></td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${user.access_status === "approved" ? "bg-emerald-50 text-emerald-700" : user.access_status === "pending" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>{user.access_status}</span></td>
                    <td className="px-5 py-4 text-[#71809d]">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-4 font-bold text-[#243653]">{(user.credits?.used ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-4 font-bold text-emerald-600">{(user.credits?.remaining ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-4 text-[#71809d]">{latest ? `${latest.action} · ${new Date(latest.created_at).toLocaleString()}` : "No activity"}</td>
                    <td className="space-y-2 px-5 py-4">
                      {!isSelf && user.access_status !== "approved" && <button type="button" onClick={() => updateAccess(user.id, "approved")} disabled={isUpdatingAccess} className="mr-2 rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">Approve</button>}
                      {!isSelf && user.access_status === "pending" && <button type="button" onClick={() => updateAccess(user.id, "rejected")} disabled={isUpdatingAccess} className="mr-2 rounded-lg bg-rose-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">Reject</button>}
                      {!isSelf && user.access_status === "approved" && <button type="button" onClick={() => updateAccess(user.id, "revoked")} disabled={isUpdatingAccess} className="mr-2 rounded-lg bg-amber-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60">Revoke Access</button>}
                      <button type="button" onClick={() => resetCredits(user.id)} disabled={isResetting} className="rounded-lg bg-[#263bd0] px-3 py-2 text-[10px] font-bold text-white hover:bg-[#182a9f] disabled:cursor-not-allowed disabled:opacity-60">{isResetting ? "Resetting..." : "Reset Credits"}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
