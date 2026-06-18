import { useCallback, useEffect, useRef } from "react";

/**
 * Minimal replacement for react-bottom-scroll-listener's `useBottomScrollListener`
 * (element-ref mode). That package ships an `.mjs` build that the CRA 4 / webpack 4
 * toolchain cannot consume, so we provide the small piece of behaviour we use.
 *
 * Returns a ref to attach to a scrollable element; `onBottom` is invoked when the
 * user scrolls to (within `offset` px of) the bottom of that element.
 *
 * @param {() => void} onBottom callback fired when the bottom is reached
 * @param {{ offset?: number, debounce?: number }} [options]
 * @returns {import("react").MutableRefObject<HTMLElement | null>}
 */
export function useBottomScrollListener(onBottom, { offset = 0, debounce = 200 } = {}) {
	const ref = useRef(null);
	const debounceTimer = useRef(null);

	const handleScroll = useCallback(
		event => {
			const target = event.target;
			const reachedBottom =
				target.scrollTop + target.clientHeight >= target.scrollHeight - offset;

			if (!reachedBottom) {
				return;
			}

			if (debounce) {
				if (debounceTimer.current) {
					return;
				}
				debounceTimer.current = setTimeout(() => {
					debounceTimer.current = null;
				}, debounce);
			}

			onBottom();
		},
		[onBottom, offset, debounce],
	);

	useEffect(() => {
		const element = ref.current;
		if (!element) {
			return undefined;
		}

		element.addEventListener("scroll", handleScroll);
		return () => {
			element.removeEventListener("scroll", handleScroll);
			if (debounceTimer.current) {
				clearTimeout(debounceTimer.current);
				debounceTimer.current = null;
			}
		};
	}, [handleScroll]);

	return ref;
}

export default useBottomScrollListener;
