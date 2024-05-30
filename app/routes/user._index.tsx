import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
	redirect,
} from "@remix-run/cloudflare";
import {
	Form,
	useActionData,
	useLoaderData,
	useNavigation,
} from "@remix-run/react";
import { useEffect } from "react";
import { modal } from "~/.client/modal";
import { anonUserNames } from "~/.server/anon";
import { prismaClient } from "~/.server/prisma";
import { badRequest } from "~/.server/request";
import { getUser } from "~/.server/supabase";
import { createCard, teamsWebhook } from "~/.server/teams-webhook";
import { dayjsJP } from "~/utils/dayjs";

export const meta: MetaFunction = () => {
	return [
		{ title: "ホーム | Z物販" },
		{ name: "description", content: "Z物販の購入画面です" },
	];
};

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
	// 商品一覧と購入履歴を取得する
	const headers = new Headers();
	const user = await getUser(context, request, headers);
	if (!user) {
		return null;
	}
	const prisma = prismaClient(context);
	// 以降のDBアクセスは並列化する
	const itemsPromise = prisma.item.findMany({
		where: {
			deletedAt: null,
		},
	});
	const dayjs = dayjsJP();
	const startOfMonth = dayjs.tz().startOf("month").toDate();
	const endOfMonth = dayjs.tz().startOf("month").add(1, "month").toDate();
	console.log(startOfMonth, endOfMonth);
	const purchasesPromise = prisma.purchase.findMany({
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
	// 匿名ユーザー用のユーザー一覧を取得
	const usersPromise = prisma.user.findMany({
		orderBy: {
			createdAt: "asc",
		},
		select: {
			id: true,
		},
	});
	// ここでまとめてawaitする
	const [items, purchases, users] = await Promise.all([
		itemsPromise,
		purchasesPromise,
		usersPromise,
	]);
	const anonNames = anonUserNames();
	const anonName = anonNames[users.map((u) => u.id).indexOf(user.id)];
	let total = 0;
	for (const purchase of purchases) {
		total += purchase.item.price;
	}
	console.log({ total, items, purchases });
	const thisMonth = dayjs.tz().month() + 1;
	return { user, thisMonth, total, items, anonName };
};

export const action = async ({ context, request }: ActionFunctionArgs) => {
	// 商品を購入する
	const headers = new Headers();
	const user = await getUser(context, request, headers);
	if (!user) {
		return redirect("/login");
	}
	const form = await request.formData();
	const itemId = form.get("itemId");
	const itemName = form.get("itemName");
	const itemPrice = form.get("itemPrice");
	const anonName = form.get("anonName");
	if (
		typeof itemId !== "string" ||
		typeof itemName !== "string" ||
		typeof itemPrice !== "string" ||
		typeof anonName !== "string"
	) {
		return badRequest({
			itemId,
			success: false,
			errorMsg: "フォームが正しく送信されませんでした",
		});
	}
	const prisma = prismaClient(context);
	const purchasePrimise = prisma.purchase.create({
		data: {
			userId: user.id,
			itemId,
		},
	});
	const webhook = new teamsWebhook(context);
	const webhookMesssage = `${anonName}が${itemName}（¥${itemPrice}）を購入しました！`;
	const card = createCard("購入通知", webhookMesssage);
	const webhookPromise = webhook.sendCard(webhookMesssage, card);
	try {
		await Promise.all([purchasePrimise, webhookPromise]);
	} catch (e) {
		console.log(e);
		return badRequest({
			itemId,
			success: false,
			errorMsg: "購入に失敗しました",
		});
	}
	return {
		itemId,
		success: true,
		errorMsg: null,
	};
};

export default function Index() {
	const loaderData = useLoaderData<typeof loader>();
	if (!loaderData) {
		return <></>;
	}
	const { user, thisMonth, total, items, anonName } = loaderData;
	const actionData = useActionData<typeof action>();
	useEffect(() => {
		if (actionData?.success) {
			modal("modal-success").showModal();
		} else if (actionData?.errorMsg) {
			modal("modal-error").showModal();
		}
	}, [actionData]);
	const navigation = useNavigation();
	useEffect(() => {
		if (navigation.state === "submitting") {
			modal("modal-loading").showModal();
		} else {
			modal("modal-loading").close();
		}
	}, [navigation.state]);
	const dayjs = dayjsJP();
	return (
		<>
			<div className="w-full flex items-center justify-center mt-4 mb-2">
				<div className="card card-bordered w-64 bg-base-100 shadow-xl">
					<div className="stat card-body flex items-center justify-center">
						<h2 className="font-bold">{thisMonth}月の利用料金</h2>
						<p className="stat-value">&yen; {total}</p>
						<div className="stat-desc flex justify-between w-full">
							<span>{user.name}さん</span>
							<span>{dayjs.tz().format("YYYY/M/D H:mm")}</span>
						</div>
					</div>
				</div>
			</div>
			<div className="m-5">
				<table className="table table-zebra">
					<thead>
						<tr>
							<th />
							<th>商品名</th>
							<th>価格</th>
						</tr>
					</thead>
					<tbody>
						{items.map((item, index) => (
							<tr key={item.id}>
								<th>{index + 1}</th>
								<td>{item.name}</td>
								<td>
									<button
										type="button"
										className="btn btn-outline btn-sm btn-info"
										onClick={() => modal(`modal-${item.id}`).showModal()}
									>
										&yen;{item.price}
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{items.map((item) => (
					<dialog key={item.id} className="modal" id={`modal-${item.id}`}>
						<div className="modal-box">
							<h3 className="font-bold text-lg">{item.name}を購入しますか？</h3>
							<p>&yen; {item.price}</p>
							<div className="modal-action">
								<Form method="post">
									<input type="hidden" name="itemId" value={item.id} />
									<input type="hidden" name="itemName" value={item.name} />
									<input type="hidden" name="itemPrice" value={item.price} />
									<input type="hidden" name="anonName" value={anonName} />
									<button
										className="btn btn-info"
										type="submit"
										onClick={() => modal(`modal-${item.id}`).close()}
									>
										購入
									</button>
								</Form>
								<form method="dialog">
									<button type="submit" className="btn">
										キャンセル
									</button>
								</form>
							</div>
						</div>
						<form method="dialog" className="modal-backdrop">
							<button type="submit">close</button>
						</form>
					</dialog>
				))}
				<dialog className="modal" id="modal-success">
					<div className="modal-box">
						<h3 className="font-bold text-lg">
							{items.find((e) => e.id === actionData?.itemId)?.name}
							を購入しました🎉
						</h3>
						<div className="modal-action">
							<form method="dialog">
								<button type="submit" className="btn">
									OK
								</button>
							</form>
						</div>
					</div>
					<form method="dialog" className="modal-backdrop">
						<button type="submit">close</button>
					</form>
				</dialog>
				<dialog className="modal" id="modal-error">
					<div className="modal-box">
						<h3 className="font-bold text-lg">⚠️購入に失敗しました🚨</h3>
						<p>{actionData?.errorMsg}</p>
						<div className="modal-action">
							<form method="dialog">
								<button type="submit" className="btn">
									OK
								</button>
							</form>
						</div>
					</div>
					<form method="dialog" className="modal-backdrop">
						<button type="submit">close</button>
					</form>
				</dialog>
				<dialog className="modal" id="modal-loading">
					<div className="modal-box">
						<div className="stat card-body flex items-center justify-center">
							<span className="loading loading-ring loading-lg" />
							<h3 className="font-bold text-lg">購入中...</h3>
						</div>
					</div>
				</dialog>
			</div>
		</>
	);
}
