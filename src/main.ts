import * as fs from "fs/promises";
import { JSDOM } from "jsdom";
import "./extensions/string.removeHtmlComment"

interface Shop {
	name: string;
	postalCode: string;
	address: string;
	tel: string;
	hours: {
		weekdays: string;
		saturday: string;
		sunday: string;
	};
}

const fetchShopListData = async () => {
	const result: {
		area: string;
		shopList: Shop[];
	}[] = [];
	const url = "http://www.k-mitsuwa.co.jp/business/komoro/tenpo.html";
	const jsdom = await JSDOM.fromURL(url);
	const divList = jsdom.window.document.getElementsByClassName("cont-page");
	for (let i = 0; i < divList.length; i++) {
		const div = divList[i];
		const area = div.getElementsByClassName("border-title")[0].innerHTML.trim();
		const storeList = div.getElementsByClassName("store-list");
		let shops: Shop[] = [];
		for (let j = 0; j < storeList.length; j++) {
			const shop: Shop = {
				name: "",
				postalCode: "",
				address: "",
				tel: "",
				hours: {
					weekdays: "",
					saturday: "",
					sunday: "",
				},
			};
			const store = storeList[j];
			if (store.childElementCount == 0) {
				continue;
			}
			shop.name = store
				.getElementsByClassName("name")[0]
				.innerHTML
				.removeHtmlComment()
				.replace("<br>", "")
				.trim();
			const table = store.getElementsByTagName("table")[0];
			const rows = table.rows;
			for (let k = 0; k < rows.length; k++) {
				const th = rows[k].cells[0];
				const td = rows[k].cells[1];
				const columnName = th.innerHTML.replace(/\s+/, "");
				if (columnName.includes("住所")) {
					const address = td.innerHTML.split("<br>");
					shop.postalCode = address[0].replace("〒", "");
					shop.address = address[1];
				} else if (columnName.includes("電話番号")) {
					shop.tel = td.innerHTML.trim();
				} else if (columnName.includes("営業時間")) {
					shop.hours.weekdays = td
						.getElementsByClassName("weekdays")[0]
						.parentElement.parentElement.getElementsByTagName("td")[0]
						.innerHTML.trim();
					shop.hours.saturday = td
						.getElementsByClassName("saturday")[0]
						.parentElement.parentElement.getElementsByTagName("td")[0]
						.innerHTML.trim();
					shop.hours.sunday = td
						.getElementsByClassName("sunday")[0]
						.parentElement.parentElement.getElementsByTagName("td")[0]
						.innerHTML.trim();
				}
			}
			shops.push(shop);
		}
		// Webサイトの構造上、渋谷区に他の区のお店が混入しているのでそれを取り除く
		if (area == "渋谷区") {
			shops = shops.filter((shop) => shop.address.includes("渋谷区"));
		}
		// また、文京区にも文京区以外のお店が混入しているのでそれを取り除く
		if (area == "文京区") {
			shops = shops.filter((shop) => shop.address.includes("文京区"));
		}
		result.push({
			area: area,
			shopList: shops,
		});
	}
	return result;
};

(async () => {
	// outputディレクトリを作成
	await fs.mkdir("./output");
	// 店舗一覧を取得
	const shopListData = await fetchShopListData();
	// エリア名と店舗名一覧のハッシュを作成
	let hash: Record<string, string[]> = {};
	shopListData.forEach(({ area, shopList }) => {
		hash[area] = shopList.map((shop) => shop.name);
	});
	// ハッシュを書き出し
	await fs.writeFile("./output/master.json", JSON.stringify(hash, null, "\t"));
	console.info("./output/master.json was created.");
	// 各エリア・各店舗ごとにJSONを作成
	for (let { area, shopList } of shopListData) {
		await fs.mkdir(`./output/${area}`, { recursive: true });
		await fs.writeFile(
			`./output/${area}/master.json`,
			JSON.stringify(shopList, null, "\t")
		);
		console.info(`./output/${area}/master.json was created.`);
		for (let shop of shopList) {
			await fs.writeFile(
				`./output/${area}/${shop.name}.json`,
				JSON.stringify(shop, null, "\t")
			);
			console.info(`./output/${area}/${shop.name}.json was created.`);
		}
	}
})();
