interface String {
	removeHtmlComment(): string
}

String.prototype.removeHtmlComment = function (): string {
	return String(this).replace(/<!--.*-->/, '')
}