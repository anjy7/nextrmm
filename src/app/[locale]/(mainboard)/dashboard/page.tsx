import { headers } from "next/headers";
import Link from "next/link";
import { Icons } from "~/components/icons";
import type { Locale } from "~/i18n-config";
import { getDictionary } from "~/lib/dictionary";
import { getServerAuthSession } from "~/server/auth";
import { CreateLocationDialog } from "./_components/create-location-dialog";
import { CreateOrganizationDialog } from "./_components/create-organization-dialog";
import { DocumentsStartupSection } from "./_components/documents-startup-section";

type Props = {
  params: { locale: Locale };
};

async function getIp(url: RequestInfo | URL) {
  const response = await fetch(url);
  return response.text();
}

export default async function DashBoard({ params: { locale } }: Props) {
  const headersList = headers();
  const userAgent = headersList.get("user-agent");
  let userIp;
  try {
    const data = await getIp("https://www.cloudflare.com/cdn-cgi/trace");
    const ipAddressRegex = /ip=([a-fA-F\d.:]+)/;
    const match = data.match(ipAddressRegex);
    if (match) {
      userIp = match[1];
    }
  } catch (error) {
    console.error("Error fetching IP:", error);
  }

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
  console.log("++++++Session", session);
  const d = await getDictionary(locale);

  return (
    <div className="ml-3 flex">
      <div className="w-1/4 flex-col">
        <h2 className="my-4 text-xl font-bold">Quick Links</h2>
        <CreateOrganizationDialog
          dictionary={d.dashboard["create-organization"]}
          id={session!.user.id}
        />
        <CreateLocationDialog
          dictionary={d.dashboard["create-location"]}
          id={session!.user.id}
        />
      </div>
      <div className="w-1/4 flex-col px-2 lg:w-3/4">
        <div>
          <h2 className="my-4 text-xl font-bold">Community</h2>
          <div className="grid w-2/3 grid-cols-3 gap-4">
            <Link
              href="/dashboard"
              className="flex flex-col items-center rounded-lg border p-4 shadow"
            >
              <div className="p-2">
                <Icons.community className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary">
                {d.dashboard["community"]["community"]}
              </h3>
            </Link>
            <Link
              href="/dashboard"
              className="flex flex-col items-center rounded-lg border p-4 shadow"
            >
              <div className="p-2">
                <Icons.document className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary">
                {d.dashboard["community"]["documentation"]}
              </h3>
            </Link>
            <Link
              href="/dashboard"
              className="flex flex-col items-center rounded-lg border p-4 shadow"
            >
              <div className="p-2">
                <Icons.news className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary">
                {d.dashboard["community"]["news"]}
              </h3>
            </Link>
          </div>
        </div>
        <DocumentsStartupSection />
      </div>
    </div>
  );
}
