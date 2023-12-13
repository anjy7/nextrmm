import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { customAlphabet } from "nanoid";
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

interface Session {
  id: string;
  userId: string;
  deviceId: string;
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
  country: string;
  deviceType: string;
  city: string;
  os: string;
  browser: string;
}
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

export function authOptions(
  userAgent?: string,
  userIp?: string,
  deviceType?: string,
): NextAuthOptions {
  return {
    callbacks: {
      async session({ session, user }: { session: any; user: any }) {
        if (session.expires === undefined || userAgent === undefined) {
          return {
            ...session,
            user: {
              ...session.user,
              id: user.id,
            },
          };
        }

        var uap = new UAParser(userAgent);
        let os = uap.getResult().os.name;
        let browser = uap.getResult().browser.name;

        // browser = (function () {
        //   var test = function (regexp: RegExp) {
        //     return regexp.test(user_agent);
        //   };
        //   switch (true) {
        //     case test(/edg/i):
        //       return "Microsoft Edge";
        //     case test(/trident/i):
        //       return "Microsoft Internet Explorer";
        //     case test(/firefox|fxios/i):
        //       return "Mozilla Firefox";
        //     case test(/opr\//i):
        //       return "Opera";
        //     case test(/ucbrowser/i):
        //       return "UC Browser";
        //     case test(/samsungbrowser/i):
        //       return "Samsung Browser";
        //     case test(/chrome|chromium|crios/i):
        //       return "Google Chrome";
        //     case test(/safari/i):
        //       return "Apple Safari";
        //     default:
        //       return "Other";
        //   }
        // })();

        let token_expires = session.expires;
        let session_model = await db.session.findFirst({
          where: {
            user: {
              id: user.id,
            },
            expires: token_expires,
          },
        });

        const ipapi_res = await fetch(`http://ipapi.co/${userIp}/json/`);
        const ipapi_json = await ipapi_res.json();
        let country = "other";
        let city = "other";
        if (ipapi_json["error"] === undefined) {
          country = ipapi_json["country_name"];
          city = ipapi_json["city"];
        }
        userIp = userIp === undefined ? "" : userIp;

        const existingSession = await db.userSessions.findFirst({
          where: {
            userId: user.id,
            city: city,
            country: country,
            browser: browser,
            os: os,
            deviceType: deviceType,
          },
        });

        if (session_model && !existingSession) {
          const id = customAlphabet(
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
            10,
          )();
          let updatedSessionModel = await db.userSessions.create({
            data: {
              createdAt: new Date(),
              updatedAt: new Date(),
              user: { connect: { id: user.id } },
              session: { connect: { id: session_model.id } },
              deviceId: id,
              os: os || "other",
              country: country,
              city: city,
              deviceType: deviceType || "other",
              browser: browser || "other",
            },
          });
        }

        const currentSession = await db.userSessions.findFirst({
          where: {
            userId: user.id,
            city: city,
            country: country,
            browser: browser,
            deviceType: deviceType,
            os: os,
          },
        });

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
}

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (
  userAgent?: string,
  userIp?: string,
  deviceType?: string,
) => getServerSession(authOptions(userAgent, userIp, deviceType));
