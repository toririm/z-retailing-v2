import { redirect } from "@remix-run/cloudflare";
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { badRequest } from "~/.server/request";
import { commitSession, getSession } from "~/.server/session";
import { supabaseClient } from "~/.server/supabase";

// this route is for handling the callback from the email magic link

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
	const url = new URL(request.url);
	const token_hash = url.searchParams.get("token_hash");
	const headers = new Headers();
	if (typeof token_hash !== "string") {
		return badRequest({
			message: "Invalid query. If you're not happy with it, try again.",
		});
	}
	const {
		data: { session: supabaseSession },
		error,
	} = await supabaseClient(context, request, headers).auth.verifyOtp({
		token_hash,
		type: "email",
	});
	console.log(error);
	if (!supabaseSession) {
		return redirect("/user");
	}
	const userSession = await getSession(request.headers.get("Cookie"));
	userSession.set("access_token", supabaseSession.access_token);
	userSession.set("refresh_token", supabaseSession.refresh_token);
	return redirect("/user", {
		headers: {
			"Set-Cookie": await commitSession(userSession),
		},
	});
};
