import {
	type ActionFunction,
	type ActionFunctionArgs,
	redirect,
} from "@remix-run/cloudflare";
import { badRequest } from "~/.server/request";
import { getAdmin } from "~/.server/supabase";
import { createCard, teamsWebhook } from "~/.server/teams-webhook";

export const action: ActionFunction = async ({
	context,
	request,
}: ActionFunctionArgs) => {
	// お知らせを送信する
	const headers = new Headers();
	const adminUser = await getAdmin(context, request, headers);
	if (!adminUser) {
		return redirect("/user");
	}
	const form = await request.formData();
	const notifyText = form.get("notifyText");
	if (typeof notifyText !== "string") {
		return badRequest({
			errorMsg: "フォームが正しく送信されませんでした",
		});
	}
	console.log(notifyText);
	const card = createCard("お知らせ", notifyText);
	const webhook = new teamsWebhook(context);
	const result = await webhook.sendCard(notifyText, card);
	console.log(result);
	return redirect("/admin");
};
