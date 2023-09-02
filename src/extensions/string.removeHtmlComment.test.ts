import "./string.removeHtmlComment"

test("末尾にコメントタグ", () => {
	const htmlText = "6:00 ～ 23:00<!--<font Color=\"#1D2088\"Size=\"2\">【店内飲食20時/テイクアウト22時】</font>-->"
	expect(htmlText.removeHtmlComment()).toBe("6:00 ～ 23:00")
})

test("先頭にコメントタグ", () => {
	const htmlText = "<!--・<font Color=\"#1D2088\">臨時休業</font>-->西新橋一丁目店"
	expect(htmlText.removeHtmlComment()).toBe("西新橋一丁目店")
})