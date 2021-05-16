import { assert, string } from 'superstruct';

chrome.alarms.onAlarm.addListener((a) => {
    sendRequest('hahahaahahaha')
});


chrome.runtime.onInstalled.addListener(() => {
	chrome.alarms.get('copdeckAlarm', (a) => {
		if (!a) {
			chrome.alarms.create('copdeckAlarm', { periodInMinutes: 0.1 });
		}
	});
});

// url: string,
// method: 'GET' | 'POST',
// headers: object,
// body?: string

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



const sendRequest = async (url, method, headers, body) => {
    console.log(url)
    // 	const query = encodeURIComponent('yeezy');
	// fetch(`https://stockx.com/api/browse?&_search=${query}&dataType=product`, {
	// 	method: 'get',
	// 	headers: headers,
	// 	// body: 'foo=bar&lorem=ipsum',
	// })
	// 	.then((res) => res.json())
	// 	.then(function (data) {
	// 		console.log('Request succeeded with JSON response', data);
	// 	})
	// 	.catch(function (error) {
	// 		console.log('Request failed', error);
	// 	});

        // todo: add timeout
        // todo: add retry
};
