import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { anonUserNames } from "~/.server/anon";
import { prismaClient } from "~/.server/prisma";
import { dayjsJP } from "~/utils/dayjs";

export const meta = () => [
	{ title: "タイムライン | Z物販" },
	{ name: "description", content: "最新の購入履歴が閲覧できます" },
];

export const loader = async ({ context }: LoaderFunctionArgs) => {
	// 購入履歴を取得する
	const prisma = prismaClient(context);
	const purchases = await prisma.purchase.findMany({
		where: {
			deletedAt: null,
		},
		select: {
			// このエンドポイントはパブリックなので、ユーザー名は表示しない
			id: true,
			createdAt: true,
			item: {
				select: {
					name: true,
					price: true,
				},
			},
			user: {
				select: {
					id: true,
				},
			},
		},
	});
	const users = purchases
		.map((purchase) => purchase.user.id)
		.filter((id, index, array) => array.indexOf(id) === index);
	const usernames = anonUserNames().slice(0, users.length);
	type PurchaseWithUsername = {
		id: string;
		createdAt: Date;
		item: {
			name: string;
			price: number;
		};
		user: {
			name: string;
		};
	};
	const purchasesWithUsernames: PurchaseWithUsername[] = purchases.map(
		(purchase) => {
			const { id, createdAt, item } = purchase;
			return {
				id,
				createdAt,
				item,
				user: {
					name: usernames[users.indexOf(purchase.user.id)],
				},
			};
		},
	);
	console.log(purchasesWithUsernames);
	return { purchases: purchasesWithUsernames.reverse() };
};

export default function Timeline() {
	const { purchases } = useLoaderData<typeof loader>();
	const dayjs = dayjsJP();
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
				</div>
			</nav>
			<div className="m-5 overflow-y-scroll h-[85svh]">
				<table className="table table-zebra">
					<thead className="sticky top-0 bg-base-100">
						<tr>
							<th />
							<th>日時</th>
							<th>内容</th>
						</tr>
					</thead>
					<tbody>
						{purchases.map((purchase, index) => (
							<tr key={purchase.id}>
								<th>{purchases.length - index}</th>
								<td>{dayjs(purchase.createdAt).tz().format("M/D H:mm")}</td>
								<td>
									{purchase.user.name}が
									<span className="font-bold pl-1">{purchase.item.name}</span>
									<span className="pr-1">（&yen; {purchase.item.price}）</span>
									を購入したよ！
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</>
	);
}
