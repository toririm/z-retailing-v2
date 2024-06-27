import { redirect } from "@remix-run/cloudflare";
import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { badRequest } from "~/.server/request";
import { supabaseClient } from "~/.server/supabase";

export const meta = () => [
	{ title: "ログイン | Y物販" },
	{ name: "description", content: "Y物販のログインページ" },
];

export const action = async ({ request, context }: ActionFunctionArgs) => {
	// ログインを行うメールアドレスを取得し、OTPをメールに送信する
	const headers = new Headers();
	const form = await request.formData();
	const email = form.get("email");
	// const accept = /^s\d{7}@u\.tsukuba\.ac\.jp$/; // 大学メールアドレスの正規表現
	if (typeof email !== "string") {
		const errorMsg = "フォームが正しく送信されませんでした";
		return badRequest({
			email: "",
			errorMsg,
		});
	}
	// if (!accept.test(email)) {
	// 	const errorMsg = "メールアドレスの形式が正しくありません";
	// 	return badRequest({
	// 		email,
	// 		errorMsg,
	// 	});
	// }
	const { data, error } = await supabaseClient(
		context,
		request,
		headers,
	).auth.signInWithOtp({
		email,
	});
	return redirect(`/login/verify?email=${email}`, 303);
};

export default function Login() {
	const actionData = useActionData<typeof action>();
	const navigation = useNavigation();
	// const [fullEmail, setFullEmail] = useState(false);
	const [email, setEmail] = useState("");
	return (
		<div className="h-screen flex justify-center items-center">
			<div className="card card-bordered bg-base-100 shadow-xl">
				<Form method="post" className="card-body items-center text-center">
					<h2 className="card-title">Y物販 ログイン</h2>
					<label className="from-control">
						<div className="label">
							<span className="label-text">メールアドレス</span>
						</div>
						{/* <div hidden={fullEmail}>
							<div className="join">
								<input
									type="text"
									className={`input input-bordered w-[6.3rem] join-item ${
										actionData?.errorMsg ? "input-error" : ""
									}`}
									onChange={(e) => setEmailnum(e.target.value)}
									autoComplete="off"
									value={emailnum}
								/>
								<div className="join-item btn no-animation">
									@u.tsukuba.ac.jp
								</div>
							</div>
						</div> */}
						<input
							name="email"
							type="email"
							placeholder="hoge@example.com"
							className={`input input-bordered ${
								actionData?.errorMsg ? "input-error" : ""
							}`}
							onChange={(e) => setEmail(e.target.value)}
							value={actionData?.email || email}
							autoComplete="off"
						/>
						<div className="label">
							{actionData?.errorMsg ? (
								<span className="label-text-alt text-error" role="alert">
									{actionData.errorMsg}
								</span>
							) : null}
						</div>
						{/* <div className="flex justify-center">
							<div className="label w-52">
								<input
									type="checkbox"
									className="toggle toggle-xs"
									onChange={(e) => setFullEmail(e.target.checked)}
								/>
								<span className="label-text-alt">
									メールアドレス全体を入力する
								</span>
							</div>
						</div> */}
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
