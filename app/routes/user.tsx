import { json, redirect } from "@remix-run/cloudflare";
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Link, Outlet, useLoaderData, useNavigation } from "@remix-run/react";
import { prismaClient } from "~/.server/prisma";
import { getAuthUser } from "~/.server/supabase";

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
	// header を返してやることで、refresh token を更新する
	const headers = new Headers();
	const authUser = await getAuthUser(context, request, headers);
	if (!authUser) {
		return redirect("/login");
	}
	const prisma = prismaClient(context);
	const user = await prisma.user.findUnique({
		where: { authId: authUser.id },
	});
	if (!user) {
		return redirect("/setup");
	}
	console.log(user);
	return json({ admin: user.admin }, { headers });
};

export default function UserRoute() {
	const { admin } = useLoaderData<typeof loader>();
	return (
		<>
			<nav className="navbar bg-base-100">
				<div className="navbar-start">
					<Link to="/user" className="btn btn-ghost text-xl">
						Ｚ物販
					</Link>
				</div>
				<div className="navbar-end mr-4">
					<Link to="/user" className="btn btn-ghost">
						ホーム
					</Link>
					<Link to="/user/history" className="btn btn-ghost">
						履歴
					</Link>
				</div>
			</nav>
			<Outlet />
			<div className="divider" />
			<nav className="navbar bg-base-100 pb-7">
				<div className="navbar-start ml-4">
					{admin ? (
						<Link to="/admin" className="btn btn-ghost text-primary">
							管理者ページ
						</Link>
					) : null}
				</div>
				<div className="navbar-center">
					<Link to="/timeline" className="btn btn-ghost">
						タイムライン
					</Link>
				</div>
				<div className="navbar-end mr-4">
					<Link to="/logout" className="btn btn-ghost text-error">
						ログアウト
					</Link>
				</div>
			</nav>
		</>
	);
}
