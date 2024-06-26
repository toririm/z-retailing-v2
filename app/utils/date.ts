import { dayjsJP } from "./dayjs";

export const getMonths = (oldest: Date, newest: Date) => {
	const dayjs = dayjsJP();
	const oldestDate = dayjs(oldest).tz().startOf("month");
	const newestDateNextMonth = dayjs(newest)
		.tz()
		.startOf("month")
		.add(1, "month");
	const months = [];
	let current = oldestDate;
	while (current.isBefore(newestDateNextMonth)) {
		months.push(current);
		current = current.add(1, "month");
	}
	return months;
};
