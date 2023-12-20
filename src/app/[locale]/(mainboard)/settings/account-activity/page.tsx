import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";
import { ActiveDevices } from "../../../../../components/active-devices";

export default async function Settings() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="px-4">
      <div className="mt-8 text-lg font-normal">Active devices</div>
      <ActiveDevices currentSession={session.currentSession} />
    </div>
  );
}
