import { type LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { prismaClient } from "~/.server/prisma";
import { getAdmin } from "~/.server/supabase";

export const meta = () => [
	{ title: "ユーザー管理 | Y物販" },
	{ name: "description", content: "管理者ページです" },
];

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
	// ユーザ一覧を取得する
	const headers = new Headers();
	const adminUser = await getAdmin(context, request, headers);
	if (!adminUser) {
		return redirect("/user");
	}
	const prisma = prismaClient(context);
	const users = await prisma.user.findMany({
		orderBy: {
			createdAt: "asc",
		},
	});
	return { users };
};

export default function AdminUsersRoute() {
	const { users } = useLoaderData<typeof loader>();
	return (
		<div className="overflow-x-auto p-4 pl-8">
			<div className="flex space-x-8">
				<ul className="menu bg-base-200 w-60 rounded-box flex-nowrap overflow-y-scroll h-[70svh]">
					{users.map((user, index) => (
						<li key={user.id}>
							<NavLink
								to={`/admin/users/${user.id}`}
								className={({ isActive }) => (isActive ? "active" : "")}
							>
								<span className="font-bold">{index + 1}</span>
								<span>
									{user.name} {user.admin && "📢"}
								</span>
							</NavLink>
						</li>
					))}
				</ul>
				<Outlet />
			</div>
		</div>
	);
}
