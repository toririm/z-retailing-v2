import { redirect } from "@remix-run/cloudflare";
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Form, useNavigation, useSearchParams } from "@remix-run/react";
import { badRequest } from "~/.server/request";
import { supabaseClient } from "~/.server/supabase";

// this route is for handling the callback from the email magic link

export const action = async ({ context, request }: LoaderFunctionArgs) => {
	const form = await request.formData();
	const token_hash = form.get("token_hash");
	console.log(token_hash);
	const headers = new Headers();
	if (typeof token_hash !== "string") {
		return badRequest({
			message: "Invalid query. If you're not happy with it, try again.",
		});
	}
	const { data, error } = await supabaseClient(
		context,
		request,
		headers,
	).auth.verifyOtp({
		token_hash,
		type: "email",
	});
	console.log(error);
	console.log(headers);
	return redirect("/user", {
		headers: headers,
	});
};

export default function CallbackWait() {
	const [params, setParams] = useSearchParams();
	const navigation = useNavigation();
	const tokenHash = params.get("token_hash");
	if (!tokenHash) {
		return redirect("/login");
	}
	console.log(tokenHash);
	return (
		<div className="h-screen flex justify-center items-center">
			<div className="card card-bordered bg-base-100 shadow-xl">
				<div className="card-body items-center text-center">
					<h2 className="card-title">ログインしますか？</h2>
					<Form method="post">
						<input type="hidden" name="token_hash" value={tokenHash} />
						<button
							type="submit"
							className="btn btn-wide btn-info"
							disabled={navigation.state !== "idle"}
						>
							{navigation.state !== "idle" ? (
								<span className="loading loading-dots loading-md" />
							) : (
								"ログイン"
							)}
						</button>
					</Form>
				</div>
			</div>
		</div>
	);
}
