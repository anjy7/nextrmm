import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";
import { ActiveDevices } from "../../../../components/active-devices";

export default async function Settings() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/login");
  }

  return redirect("/settings/general");
}
