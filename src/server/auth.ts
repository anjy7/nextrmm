import { cookies, headers } from "next/headers";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { Resend } from "resend";
import { UAParser } from "ua-parser-js";
import { NewLocationTemplate } from "~/components/email-template/new-location-sign-in";
import { SignInTemplate } from "~/components/email-template/sign-in";
import { SignUpTemplate } from "~/components/email-template/sign-up";
import { env } from "~/env.mjs";
import type { Locale } from "~/i18n-config";
import { getDictionary } from "~/lib/dictionary";
import { authDataSchema } from "~/lib/validation/auth";
import { db } from "~/server/db";

const resend = new Resend("re_T3T2Nw76_LrnEcTmQxUC3oXfdAJ92WQmM");

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string; // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
    currentSession: Session;
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    async session({ session, user }: { session: any; user: any }) {
      const userAgent = headers().get("user-agent");
      const userIp = headers().get("x-forwarded-for");

      let deviceType = Boolean(
        userAgent?.match(
          /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i,
        ),
      )
        ? "Mobile"
        : "Desktop";

      let uap;
      let os;
      let browser;
      if (userAgent) {
        uap = new UAParser(userAgent);
        os = uap.getResult().os.name;
        browser = uap.getResult().browser.name;
      }

      let city = headers().get("city") || "other";
      let country = headers().get("country") || "other";

      const existingSession = await db.session.findFirst({
        where: {
          sessionToken: cookies().get("next-auth.session-token")?.value,
        },
      });

      let updateSession;
      let currentSession;
      if (
        existingSession?.city == "" ||
        existingSession?.country == "" ||
        existingSession?.os == "" ||
        existingSession?.browser == "" ||
        existingSession?.deviceType == "" ||
        existingSession?.ip == ""
      ) {
        if (userIp) {
          let existingUser = await db.session.findMany({
            where: {
              userId: user.id,
            },
          });
          //checks if user with same Ip address has a session already
          let userSessionUsingIp = await db.session.findMany({
            where: {
              ip: userIp,
              userId: user.id,
            },
          });
          //if the IP is new i.e no match found for the user session with same IP, send email
          if (userSessionUsingIp.length == 0 && existingUser) {
            try {
              const user = await db.user.findUnique({
                where: {
                  email: session.user.email,
                },
                select: {
                  emailVerified: true,
                },
              });

              let email_send_response = await resend.emails.send({
                from: env.EMAIL_FROM,
                to: session.user.email,
                subject:
                  "Alert: Login from New Location Detected into your NextRMM account.",
                text: `Access from a New Location Detected with IP: ${userIp}\n\n`,
                react: NewLocationTemplate({
                  username: session.user.name,
                  account: session.user.email,
                  time: new Date().toLocaleString(),
                  ip: userIp,
                  city: city,
                  country: country,
                  os: os || "other",
                  browser: browser || "other",
                }),
              });
            } catch (error) {
              throw new Error(`Email could not be sent.`);
            }
          }
        }

        updateSession = await db.session.update({
          where: {
            id: existingSession?.id,
          },
          data: {
            ip: userIp || "",
            os: os || "other",
            country: country,
            city: city,
            deviceType: deviceType || "other",
            browser: browser || "other",
            lastActivity: new Date(),
          },
        });
        currentSession = updateSession;
      } else {
        const threshold = 2 * 60 * 1000; // Threshold: 2 minutes (adjusted as needed)
        let lastUpdateTimestamp = existingSession?.lastActivity;
        const currentTime = new Date().getTime();
        let canUpdateNow = false;

        if (lastUpdateTimestamp) {
          const lastUpdate = lastUpdateTimestamp.getTime();
          canUpdateNow = currentTime - lastUpdate >= threshold;
        }

        if (canUpdateNow) {
          updateSession = await db.session.update({
            where: {
              id: existingSession?.id,
            },
            data: {
              lastActivity: new Date(),
            },
          });
          currentSession = updateSession;
        } else {
          currentSession = existingSession;
        }
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
        currentSession,
      };
    },
  },
  pages: {
    signIn: "/login",
  },
  adapter: PrismaAdapter(db),
  providers: [
    // DiscordProvider({
    //   clientId: env.DISCORD_CLIENT_ID,
    //   clientSecret: env.DISCORD_CLIENT_SECRET,
    // }),
    EmailProvider({
      server: {
        host: env.EMAIL_SERVER_HOST,
        port: env.EMAIL_SERVER_PORT,
        auth: {
          user: env.EMAIL_SERVER_USER,
          pass: env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: env.EMAIL_FROM,
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        try {
          const { host } = new URL(url);
          const splits = identifier.split("+");
          const email = splits[0];
          const locale = splits[1] ?? "en";

          // Email provider lowercase all the letters so we need to transform it back for locales like "es-ES"
          const transformedLocale = locale
            .split("-")
            .map((part, index) => (index > 0 ? part.toUpperCase() : part))
            .join("-");

          const isEmailValid = authDataSchema.safeParse({ email });

          if (!isEmailValid.success) {
            throw new Error("Invalid Email.");
          }

          const user = await db.user.findUnique({
            where: {
              email: isEmailValid.data.email,
            },
            select: {
              emailVerified: true,
            },
          });

          const dictionary = await getDictionary(transformedLocale as Locale);
          const signInDictionary = dictionary["sign-in-email-template"];
          const signUpDictionary = dictionary["sign-up-email-template"];

          console.log("login_url\n", url);
          let email_send_response = await resend.emails.send({
            from: provider.from,
            to: isEmailValid.data.email,
            subject: `Sign in to ${host}.`,
            text: `Sign in to ${host}\n${url}\n\n`,
            react: user
              ? SignInTemplate({ host, url, d: signInDictionary })
              : SignUpTemplate({
                  host,
                  url,
                  d: signUpDictionary,
                }),
          });
        } catch (error) {
          throw new Error(`Email could not be sent.`);
        }
      },
    }),
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }) /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */,
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
