import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import type { AppLoadContext } from "@remix-run/cloudflare";

export const prismaClient = (context: AppLoadContext) => {
	const env = context.cloudflare.env;
	return new PrismaClient({
		datasourceUrl: env.DATABASE_URL_WITH_ACCELERATE,
	}).$extends(withAccelerate());
};
