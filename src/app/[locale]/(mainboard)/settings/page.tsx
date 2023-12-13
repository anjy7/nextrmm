import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActiveUserSessions } from "~/components/active-user-sessions";
import { getServerAuthSession } from "~/server/auth";
import { ActiveDevices } from "../../../../components/active-devices";

function extractIp(url: RequestInfo | URL) {
  return fetch(url).then((res) => res.text());
}
export default async function Settings() {
  const headersList = headers();
  const userAgent = headersList.get("user-agent");
  let userIp;

  extractIp("https://www.cloudflare.com/cdn-cgi/trace").then((data) => {
    const ipAddressRegex = /ip=([a-fA-F\d.:]+)/;
    const match = data.match(ipAddressRegex);
    if (match) {
      userIp = match[1];
    }
  });

  let deviceType = Boolean(
    userAgent?.match(
      /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i,
    ),
  )
    ? "Mobile"
    : "Desktop";

  const session = await getServerAuthSession(
    userAgent ?? "",
    userIp ?? "",
    deviceType ?? "",
  );
  if (!session) {
    redirect("/login");
  }

  console.log("?????", session?.currentSession);
  return (
    <div className="px-4">
      <div className="pt-4 text-xl font-medium">Settings</div>
      <div className="text-slate-500">Manage your security prefernces</div>
      <div className="py-3 text-lg font-normal">Active devices</div>
      {/* <ActiveDevices session={session?.currentSession}/> */}
    </div>
  );
}
