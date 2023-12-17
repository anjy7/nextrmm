import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";
import { ActiveDevices } from "../../../../components/active-devices";

export default async function Settings() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="px-4">
      <div className="pt-4 text-xl font-medium">Settings</div>
      <div className="text-slate-500">Manage your security prefernces</div>
      <div className="py-3 text-lg font-normal">Active devices</div>
      <ActiveDevices currentSession={session.currentSession} />
    </div>
  );
}
