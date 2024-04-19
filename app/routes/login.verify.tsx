import {
	Form,
	redirect,
	useNavigation,
	useSearchParams,
} from "@remix-run/react";
import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { badRequest } from "~/.server/request";
import { supabaseClient } from "~/.server/supabase";

export const action = async ({ context, request }: ActionFunctionArgs) => {
	const headers = new Headers();
	const form = await request.formData();
	const email = form.get("email");
	const otp = form.get("otp");
	if (typeof email !== "string" || typeof otp !== "string") {
		return badRequest({
			email: "",
			errorMsg: "フォームが正しく送信されませんでした",
		});
	}
	const supabase = supabaseClient(context, request, headers);
	const { data, error } = await supabase.auth.verifyOtp({
		email,
		token: otp,
		type: "email",
	});
	return redirect("/user", {
		headers: headers,
	});
};

export default function LoginVerify() {
	const navigation = useNavigation();
	const [params, setParams] = useSearchParams();
	const email = params.get("email");
	if (!email) {
		return redirect("/login");
	}
	return (
		<div className="h-screen flex justify-center items-center">
			<div className="card card-bordered bg-base-100 shadow-xl">
				<Form method="post" className="card-body items-center text-center">
					<h2 className="card-title">Z物販 ログイン</h2>
					<label className="from-control">
						<div className="label">
							<span className="label-text">大学メールアドレス</span>
						</div>
						<input type="hidden" name="email" value={email} />
						<input
							type="email"
							className="input input-bordered"
							autoComplete="off"
							value={email}
							disabled
						/>
						<div className="label">
							<span className="label-text">ワンタイムパスワード</span>
						</div>
						<input
							name="otp"
							type="text"
							placeholder="123456"
							className="input input-bordered"
							autoComplete="off"
						/>
					</label>
					<div className="card-actions">
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
					</div>
				</Form>
			</div>
		</div>
	);
}
