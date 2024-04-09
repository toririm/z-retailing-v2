import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { logout } from "~/.server/supabase";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	return await logout(request, "/login");
};
