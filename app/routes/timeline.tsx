import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import {
	type PurchaseWithUserItem,
	filterPurchasesUserName,
	getItemMutationInfo,
	getItemsFromPurchases,
	getUsersFromPurchasesName,
} from "~/.client/timeline";
import { anonUserNames } from "~/.server/anon";
import { prismaClient } from "~/.server/prisma";
import { getMonths } from "~/utils/date";
import { dayjsJP } from "~/utils/dayjs";

export const meta = () => [
	{ title: "タイムライン | Y物販" },
	{ name: "description", content: "最新の購入履歴が閲覧できます" },
];

export const loader = async ({ context }: LoaderFunctionArgs) => {
	// 購入履歴を取得する
	const prisma = prismaClient(context);
	const purchasesPromise = prisma.purchase.findMany({
		orderBy: {
			createdAt: "desc",
		},
		where: {
			deletedAt: null,
		},
		select: {
			// このエンドポイントはパブリックなので、ユーザー名は表示しない
			id: true,
			createdAt: true,
			item: {
				select: {
					id: true,
					name: true,
					price: true,
					createdAt: true,
					deletedAt: true,
				},
			},
			user: {
				select: {
					id: true,
				},
			},
		},
	});
	// 匿名ユーザーネーム用のユーザーを取得する
	const usersPromise = prisma.user.findMany({
		orderBy: {
			createdAt: "asc",
		},
		select: {
			id: true,
		},
	});
	const [purchases, users] = await Promise.all([
		purchasesPromise,
		usersPromise,
	]);
	// 匿名ユーザーネームを取得する
	const usernames = anonUserNames().slice(0, users.length);
	// 匿名ユーザーネームを付与する
	const purchasesWithUsernames: PurchaseWithUserItem[] = purchases.map(
		(purchase) => {
			const { id, createdAt, item } = purchase;
			return {
				id,
				createdAt,
				item,
				user: {
					name: usernames[users.map((u) => u.id).indexOf(purchase.user.id)],
				},
			};
		},
	);
	console.log(purchasesWithUsernames);
	return { purchases: purchasesWithUsernames };
};

export default function Timeline() {
	const { purchases } = useLoaderData<typeof loader>();
	const dayjs = dayjsJP();
	const [filterDate, setFilterDate] = useState("all");
	const [filterUser, setFilterUser] = useState("all");
	const [filterItem, setFilterItem] = useState("all");
	const oldest = new Date(purchases[purchases.length - 1].createdAt);
	const newest = new Date(purchases[0].createdAt);
	const months = getMonths(oldest, newest);
	const users = getUsersFromPurchasesName(purchases);
	const items = getItemsFromPurchases(purchases);
	const filteredPurchases = filterPurchasesUserName(
		purchases,
		filterDate,
		filterUser,
		filterItem,
	);
	const itemMutationInfo = getItemMutationInfo(items, filterItem);
	const timeline = [...filteredPurchases, ...itemMutationInfo].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
	return (
		<>
			<nav className="navbar bg-base-100">
				<div className="navbar-start">
					<Link to="/user" className="btn btn-ghost text-xl">
						Ｙ物販
					</Link>
				</div>
				<div className="navbar-end mr-4">
					<Link to="/user" className="btn btn-ghost">
						ホーム
					</Link>
				</div>
			</nav>
			<div className="m-5 overflow-y-scroll h-[85svh]">
				<p>匿名ユーザーネームは毎月シャッフルされます</p>
				<table className="table table-zebra">
					<thead className="sticky top-0 bg-base-100">
						<tr>
							<th>購入数</th>
							<th>日時</th>
							<th>内容</th>
						</tr>

						<tr>
							<th>{filteredPurchases.length}</th>
							<th>
								<select
									className="select select-bordered select-xs w-full max-w-xs"
									value={filterDate}
									onChange={(e) => setFilterDate(e.target.value)}
								>
									<option value="all" selected>
										全ての期間
									</option>
									{months.map((month) => (
										<option
											key={month.format("YYYY-MM")}
											value={month.toString()}
										>
											{month.format("YYYY年M月")}
										</option>
									))}
								</select>
							</th>
							<th>
								<select
									className="select select-bordered select-xs w-1/2 max-w-xs"
									value={filterUser}
									onChange={(e) => setFilterUser(e.target.value)}
								>
									<option value="all" selected>
										全てのユーザー
									</option>
									{users.map((user) => (
										<option key={user.name} value={user.name}>
											{user.name}
										</option>
									))}
								</select>
								<select
									className="select select-bordered select-xs w-1/2 max-w-xs"
									value={filterItem}
									onChange={(e) => setFilterItem(e.target.value)}
								>
									<option value="all" selected>
										全てのアイテム
									</option>
									{items.map((item) => (
										<option key={item.id} value={item.id}>
											{item.deletedAt ? null : "⭕"}
											{"\t"}
											{item.name}（&yen;{item.price}）
										</option>
									))}
								</select>
							</th>
						</tr>
					</thead>
					<tbody>
						{timeline.map((event, index) =>
							"type" in event ? (
								<tr key={`${event.item}-${event.type}`}>
									<th>{event.type === "create" ? "🐣" : "💀"}</th>
									<td>{dayjs(event.createdAt).tz().format("M/D H:mm")}</td>
									<td>
										{event.type === "create"
											? `${event.item.name} （¥${event.item.price}）が追加されました！`
											: `${event.item.name} （¥${event.item.price}）が削除されました`}
									</td>
								</tr>
							) : (
								<tr key={event.id}>
									<th>
										{filteredPurchases.length -
											index +
											timeline.slice(0, index).filter((e) => "type" in e)
												.length}
									</th>
									<td>{dayjs(event.createdAt).tz().format("M/D H:mm")}</td>
									<td>
										{event.user.name}が
										<span className="font-bold pl-1">{event.item.name}</span>
										<span className="pr-1">（&yen; {event.item.price}）</span>
										を購入したよ！
									</td>
								</tr>
							),
						)}
					</tbody>
				</table>
			</div>
		</>
	);
}
