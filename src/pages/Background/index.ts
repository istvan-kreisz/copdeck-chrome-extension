chrome.alarms.onAlarm.addListener(async () => {});

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
	if (msg.search) {
		sendResponse('got it');
		const names = await searchStockx(msg.search);
		chrome.storage.sync.set({ names: names });
	}
});

chrome.runtime.onInstalled.addListener(() => {
	chrome.alarms.get('copdeckAlarm', (a) => {
		if (!a) {
			chrome.alarms.create('copdeckAlarm', { delayInMinutes: 0.1 });
		}
	});
});

// todo: add timeout
// todo: add retry
// todo: useragents
// todo:

const searchStockx = async (query: string) => {
	const headers = {
		'user-agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36',
		'sec-fetch-dest': 'none',
		accept: '*/*',
		'sec-fetch-site': 'cross-site',
		'sec-fetch-mode': 'cors',
		'accept-language': 'en-US',
		cors: 'Access-Control-Allow-*',
	};

	const res: any = await sendRequest(
		`https://stockx.com/api/browse?&_search=${query}&dataType=product`,
		'get',
		headers,
		true
	);
	const names: Array<any> = res['Products'].map((prod: any) => prod.title);
	return names;

	// const resultArray = convertToArray(
	// 	res?.Products,
	// 	schema,
	// 	(element) => !element.hidden,
	// 	{
	// 		store: StoreEnum.stockx,
	// 	}
	// );
	// return resultArray.map((val) => {
	// 	return {
	// 		name: val.title,
	// 		sku: val.styleId,
	// 		slug: val.id,
	// 		retailPrice: val.retailPrice,
	// 		referer: null,
	// 		brand: val.brand,
	// 		store: val.store,
	// 		imageURL: val.media.imageUrl,
	// 	};
	// });
};

const sendRequest = async (
	url: string,
	method: 'get' | 'post',
	headers: Record<string, string>,
	useProxy: boolean,
	body?: string
) => {
	try {
		const res = await fetch(url, {
			method: method,
			headers: headers,
			...(body && {
				body: body,
			}),
		});
		return res.json();
	} catch (err) {
		console.error(err);
		return [];
	}
};
