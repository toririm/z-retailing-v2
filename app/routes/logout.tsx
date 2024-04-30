import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { logout } from "~/.server/supabase";

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
	// このエンドポイントにアクセスするとログアウトする
	const headers = new Headers();
	return await logout(context, request, headers, "/login");
};
