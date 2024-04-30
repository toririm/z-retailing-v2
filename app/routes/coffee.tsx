import { isRouteErrorResponse, useRouteError } from "@remix-run/react";

export const loader = () => {
	// 418 I'm a teapot
	// 絶対エラーを発生させる
	throw new Response(null, {
		status: 418,
		statusText: "I'm a teapot",
	});
};

export function ErrorBoundary() {
	const error = useRouteError();
	return (
		<div>
			{isRouteErrorResponse(error) ? (
				<img src="/assets/418I'mateapot.png" alt="418 I'm a tea pot" />
			) : error instanceof Error ? (
				error.message
			) : (
				"Unknown Error"
			)}
		</div>
	);
}
