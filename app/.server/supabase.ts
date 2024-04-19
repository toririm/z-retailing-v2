import type { User } from "@prisma/client";
import { type AppLoadContext, redirect, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { createServerClient, parse, serialize } from "@supabase/ssr";
import { type User as AuthUser, createClient } from "@supabase/supabase-js";
import { prismaClient } from "./prisma";
import { commitSession, destroySession, getSession } from "./session";

export const supabaseClient = (
	context: AppLoadContext,
	request: LoaderFunctionArgs["request"],
	headers: Headers,
) => {
	const { env } = context.cloudflare;
	const cookies = parse(request.headers.get("Cookie") || "");
	return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
		cookies: {
			get(key) {
				return cookies[key];
			},
			set(key, value, options) {
				headers.append("Set-Cookie", serialize(key, value, options));
			},
			remove(key, options) {
				headers.append("Set-Cookie", serialize(key, "", options));
			},
		},
	});
};

export const getAuthUser = async (
	context: AppLoadContext,
	request: LoaderFunctionArgs["request"],
	headers: Headers,
): Promise<AuthUser | null> => {
	const supabase = supabaseClient(context, request, headers);
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return user;
};

export const logout = async (
	context: AppLoadContext,
	request: LoaderFunctionArgs["request"],
	headers: Headers,
	redirectUrl: string,
) => {
	const supabase = supabaseClient(context, request, headers);
	await supabase.auth.signOut();
	return redirect(redirectUrl, { headers });
};

export const getAdmin = async (
	context: AppLoadContext,
	request: LoaderFunctionArgs["request"],
	headers: Headers,
): Promise<User | null> => {
	const authUser = await getAuthUser(context, request, headers);
	if (!authUser) {
		return null;
	}
	const prisma = prismaClient(context);
	const adminUser = await prisma.user.findUnique({
		where: {
			authId: authUser.id,
			admin: true,
		},
	});
	return adminUser;
};

export const getUser = async (
	context: AppLoadContext,
	request: LoaderFunctionArgs["request"],
	headers: Headers,
): Promise<User | null> => {
	const authUser = await getAuthUser(context, request, headers);
	if (!authUser) {
		return null;
	}
	const prisma = prismaClient(context);
	const user = await prisma.user.findUnique({
		where: {
			authId: authUser.id,
		},
	});
	return user;
};
