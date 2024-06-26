import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Link, redirect, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import {
	filterPurchasesUserId,
	getItemsFromPurchases,
	getUsersFromPurchasesUserId,
} from "~/.client/timeline";
import { prismaClient } from "~/.server/prisma";
import { getAdmin } from "~/.server/supabase";
import { getMonths } from "~/utils/date";
import { dayjsJP } from "~/utils/dayjs";

export const meta = () => [
	{ title: "管理者タイムライン | Z物販" },
	{ name: "description", content: "最新の購入履歴が閲覧できます" },
];

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
	// 購入履歴を取得する
	const headers = new Headers();
	const admin = getAdmin(context, request, headers);
	if (!admin) {
		return redirect("/user");
	}
	const prisma = prismaClient(context);
	const purchases = await prisma.purchase.findMany({
		where: {
			deletedAt: null,
		},
		select: {
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
					name: true, // 管理者ページなのでユーザー名も表示する
				},
			},
		},
	});
	return { purchases: purchases.reverse() };
};

export default function Timeline() {
	const { purchases } = useLoaderData<typeof loader>();
	const [filterDate, setFilterDate] = useState("all");
	const [filterUser, setFilterUser] = useState("all");
	const [filterItem, setFilterItem] = useState("all");
	const dayjs = dayjsJP();
	const oldest = new Date(purchases[purchases.length - 1].createdAt);
	const newest = new Date(purchases[0].createdAt);
	const months = getMonths(oldest, newest);
	const users = getUsersFromPurchasesUserId(purchases);
	const items = getItemsFromPurchases(purchases);
	const filteredPurchases = filterPurchasesUserId(
		purchases,
		filterDate,
		filterUser,
		filterItem,
	);
	const itemMutationInfo = items
		.flatMap((item) =>
			item.deletedAt
				? [
						{ createdAt: item.createdAt, type: "create", item },
						{ createdAt: item.deletedAt, type: "delete", item },
					]
				: [{ createdAt: item.createdAt, type: "create", item }],
		)
		.filter((info) => info.item.id === filterItem);
	const timeline = [...filteredPurchases, ...itemMutationInfo].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
	const sales = filteredPurchases
		.map((pur) => pur.item.price)
		.reduce((a, b) => a + b, 0);
	return (
		<>
			<div className="w-full flex items-center justify-center mt-4 mb-2">
				<div className="card card-bordered w-64 bg-base-100 shadow-xl">
					<div className="stat card-body flex items-center justify-center">
						<h2 className="font-bold">表示条件での総利用料金</h2>
						<p className="stat-value">&yen; {sales}</p>
						<div className="stat-desc flex justify-between w-full">
							<span />
							<span>{dayjs.tz().format("YYYY/M/D H:mm")}</span>
						</div>
					</div>
				</div>
			</div>
			<div className="m-5 overflow-y-scroll h-[70svh]">
				<table className="table table-zebra">
					<thead className="sticky top-0 bg-base-100">
						<tr>
							<th>販売数</th>
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
										<option key={user.id} value={user.id}>
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
										<Link
											to={`/admin/users/${event.user.id}`}
											className="font-bold pr-1"
										>
											{event.user.name}
										</Link>
										が<span className="font-bold pl-1">{event.item.name}</span>
										<span className="pr-1">（&yen; {event.item.price}）</span>
										を購入したよ！
									</td>
								</tr>
							),
						)}
						{/*
						filteredPurchases.map((purchase) => (
							<tr key={purchase.id}>
								<td>{dayjs(purchase.createdAt).tz().format("M/D H:mm")}</td>
								<td>
									<Link
										to={`/admin/users/${purchase.user.id}`}
										className="font-bold pr-1"
									>
										{purchase.user.name}
									</Link>
									が<span className="font-bold pl-1">{purchase.item.name}</span>
									<span className="pr-1">（&yen; {purchase.item.price}）</span>
									を購入したよ！
								</td>
							</tr>
						))
					*/}
					</tbody>
				</table>
			</div>
		</>
	);
}
