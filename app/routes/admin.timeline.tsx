import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Link, redirect, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { prismaClient } from "~/.server/prisma";
import { getAdmin } from "~/.server/supabase";
import { dayjsJP } from "~/utils/dayjs";

export const meta = () => [
	{ title: "管理者タイムライン | Z物販" },
	{ name: "description", content: "最新の購入履歴が閲覧できます" },
];

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
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
					name: true,
					price: true,
				},
			},
			user: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});
	return { purchases: purchases.reverse() };
};

const getMonths = (oldest: Date, newest: Date) => {
	const dayjs = dayjsJP();
	const oldestDate = dayjs(oldest).tz().startOf("month");
	const newestDateNextMonth = dayjs(newest).tz().startOf("month").add(1, "month");
	const months = [];
	let current = oldestDate;
	while (current.isBefore(newestDateNextMonth)) {
		months.push(current);
		current = current.add(1, "month");
	}
	return months;
};

export default function Timeline() {
	const { purchases } = useLoaderData<typeof loader>();
	const [filterDate, setFilterDate] = useState("all");
	const [filterUser, setFilterUser] = useState("all");
	const dayjs = dayjsJP();
	const oldest = new Date(purchases[purchases.length - 1].createdAt);
	const newest = new Date(purchases[0].createdAt);
	const months = getMonths(oldest, newest);
	const users = purchases
		.filter(
			(purchase, index) =>
				purchases.map((pur) => pur.user.id).indexOf(purchase.user.id) === index,
		)
		.map((pur) => pur.user);
	const filteredPurchases = purchases
		.filter((pur) => {
			if (filterDate === "all") {
				return true;
			}
			const month = dayjs(filterDate).tz().startOf("month");
			const next = month.add(1, "month");
			const createdAt = new Date(pur.createdAt);
			return month.toDate() <= createdAt && createdAt < next.toDate();
		})
		.filter((pur) => {
			if (filterUser === "all") {
				return true;
			}
			return pur.user.id === filterUser;
		});
	return (
		<>
			<div className="m-5 overflow-y-scroll h-[70svh]">
				<table className="table table-zebra">
					<thead className="sticky top-0 bg-base-100">
						<tr>
							<th>日時</th>
							<th>内容</th>
						</tr>
						<tr>
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
									className="select select-bordered select-xs w-full max-w-xs"
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
							</th>
						</tr>
					</thead>
					<tbody>
						{filteredPurchases.map((purchase) => (
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
						))}
					</tbody>
				</table>
			</div>
		</>
	);
}
