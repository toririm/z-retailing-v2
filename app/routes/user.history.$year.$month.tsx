import {
	type LoaderFunctionArgs,
	type MetaFunction,
	redirect,
} from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import type { Dayjs } from "dayjs";
import { prismaClient } from "~/.server/prisma";
import { getUser } from "~/.server/supabase";
import { dayjsJP } from "~/utils/dayjs";

export const meta: MetaFunction = ({ params }) => [
	{ title: `購入履歴 - ${params.year}年${params.month}月 | Z物販` },
	{ name: "description", content: "購入履歴を提供します" },
];

export const loader = async ({
	context,
	request,
	params,
}: LoaderFunctionArgs) => {
	// $year年$month月の購入履歴を取得する
	const headers = new Headers();
	if (typeof params.year !== "string" || typeof params.month !== "string") {
		return redirect("/user/history");
	}
	const year = Number.parseInt(params.year);
	const month = Number.parseInt(params.month);
	if (Number.isNaN(year) || Number.isNaN(month)) {
		return redirect("/user/history");
	}
	if (month < 1 || month > 12) {
		return redirect("/user/history");
	}
	const user = await getUser(context, request, headers);
	if (!user) {
		return redirect("/login");
	}
	const dayjs = dayjsJP();
	const baseDate = dayjs
		.tz()
		.year(year)
		.month(month - 1);
	const startOfMonth = baseDate.startOf("month").toDate();
	const endOfMonth = baseDate.add(1, "month").startOf("month").toDate();
	const prisma = prismaClient(context);
	const purchases = await prisma.purchase.findMany({
		include: {
			item: true,
		},
		where: {
			userId: user.id,
			createdAt: {
				// startOfMonth <= createdAt < endOfMonth
				gte: startOfMonth,
				lt: endOfMonth,
			},
			deletedAt: null,
		},
	});
	console.log(purchases);
	return { user, purchases, year, month };
};

export default function UserHistoryYearMonth() {
	const { user, purchases, year, month } = useLoaderData<typeof loader>();
	const dayjs = dayjsJP();
	const getYM = (date: Dayjs) => {
		const year = date.year().toString();
		const month = (date.month() + 1).toString().padStart(2, "0");
		return { year, month };
	};
	const thisDate = dayjs
		.tz()
		.year(year)
		.month(month - 1)
		.startOf("month");
	const prevDate = getYM(thisDate.subtract(1, "month"));
	const nextDate = getYM(thisDate.add(1, "month"));
	const current = new Date();
	return (
		<>
			<div>
				<div className="ml-8">
					<h1 className="text-2xl font-bold">購入履歴</h1>
					<p className="text-xl">
						{year}年{month}月
					</p>
					<p className="text-xl">{user.name}さん</p>
				</div>
				<div className="mt-3 flex justify-center">
					<div className="join">
						<Link
							to={`/user/history/${prevDate.year}/${prevDate.month}`}
							className="join-item btn btn-sm"
						>
							{`≪ ${Number.parseInt(prevDate.month)}月`}
						</Link>
						<div className="join-item btn btn-sm">{`${year}.${month}`}</div>
						{current > thisDate.add(1, "month").toDate() ? (
							<Link
								to={`/user/history/${nextDate.year}/${nextDate.month}`}
								className="join-item btn btn-sm"
							>
								{`${Number.parseInt(nextDate.month)}月 ≫`}
							</Link>
						) : (
							<div className="join-item btn btn-sm btn-disabled">
								{`${Number.parseInt(nextDate.month)}月 ≫`}
							</div>
						)}
					</div>
				</div>
			</div>
			<div className="overflow-x-auto m-5">
				<table className="table table-zebra">
					<thead>
						<tr>
							<th />
							<th>日時</th>
							<th>商品名</th>
							<th>価格</th>
						</tr>
					</thead>
					<tbody>
						{purchases.map((purchase, index) => (
							<tr key={purchase.id}>
								<th>{index + 1}</th>
								<td>{dayjs(purchase.createdAt).format("M/D H:mm")}</td>
								<td>{purchase.item.name}</td>
								<td>&yen;{purchase.item.price}</td>
							</tr>
						))}
						<tr>
							<td />
							<td />
							<th>合計</th>
							<th>
								&yen;
								{purchases.reduce(
									(sum, purchase) => sum + purchase.item.price,
									0,
								)}
							</th>
						</tr>
					</tbody>
				</table>
			</div>
		</>
	);
}
