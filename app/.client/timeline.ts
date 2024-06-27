import type { Item, Purchase } from "@prisma/client";
import { dayjsJP } from "~/utils/dayjs";

export interface PurchaseWithUserItem
	extends Omit<Purchase, "userId" | "itemId" | "deletedAt"> {
	item: Omit<Item, "ownerId">;
	user: {
		name: string;
	};
}

interface ItemStr extends Omit<Item, "ownerId" | "createdAt" | "deletedAt"> {
	createdAt: string;
	deletedAt: string | null;
}

interface PurchaseWithUserItemStr
	extends Omit<PurchaseWithUserItem, "createdAt" | "item"> {
	item: ItemStr;
	createdAt: string;
}

export const getUsersFromPurchasesName = (
	purchases: PurchaseWithUserItemStr[],
) => {
	const users = purchases
		.filter(
			(purchase, index) =>
				purchases.map((pur) => pur.user.name).indexOf(purchase.user.name) ===
				index,
		)
		.map((pur) => pur.user);
	return users;
};

interface PurchaseWithUserItemStrUserId
	extends Omit<PurchaseWithUserItemStr, "user"> {
	user: {
		name: string;
		id: string;
	};
}

export const getUsersFromPurchasesUserId = (
	purchases: PurchaseWithUserItemStrUserId[],
) => {
	const users = purchases
		.filter(
			(purchase, index) =>
				purchases.map((pur) => pur.user.id).indexOf(purchase.user.id) === index,
		)
		.map((pur) => pur.user);
	return users;
};

export const getItemsFromPurchases = (purchases: PurchaseWithUserItemStr[]) => {
	const users = purchases
		.filter(
			(purchase, index) =>
				purchases.map((pur) => pur.item.id).indexOf(purchase.item.id) === index,
		)
		.map((pur) => pur.item)
		.sort((a, b) => a.name.localeCompare(b.name, "ja"));
	return users;
};

export const filterPurchasesUserName = (
	purchases: PurchaseWithUserItemStr[],
	filterDate: string,
	filterUserName: string,
	filterItem: string,
) => {
	const dayjs = dayjsJP();
	const filterPurchases = purchases
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
			if (filterUserName === "all") {
				return true;
			}
			return pur.user.name === filterUserName;
		})
		.filter((pur) => {
			if (filterItem === "all") {
				return true;
			}
			return pur.item.id === filterItem;
		});
	return filterPurchases;
};

export const filterPurchasesUserId = (
	purchases: PurchaseWithUserItemStrUserId[],
	filterDate: string,
	filterUserId: string,
	filterItem: string,
) => {
	const dayjs = dayjsJP();
	const filterPurchases = purchases
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
			if (filterUserId === "all") {
				return true;
			}
			return pur.user.id === filterUserId;
		})
		.filter((pur) => {
			if (filterItem === "all") {
				return true;
			}
			return pur.item.id === filterItem;
		});
	return filterPurchases;
};

export const getItemMutationInfo = (items: ItemStr[], filterItem: string) => {
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
	return itemMutationInfo;
};
