console.log('This is the background page.');
console.log('Put the background scripts here.');

import * as rax from 'retry-axios';
import axios from 'axios';

chrome.alarms.onAlarm.addListener((a) => {
	console.log('-------');
});

import { assert, string } from 'superstruct';

chrome.runtime.onInstalled.addListener(() => {
	// chrome.alarms.get('copdeckAlarm', (a) => {
	// 	if (!a) {
	// 		chrome.alarms.create('copdeckAlarm', { periodInMinutes: 0.1 });
	// 	}
	// });

	let userId = 'mam';
	assert(userId, string());

	console.log(userId);

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

	const query = encodeURIComponent('yeezy');
	// return sendRequest(
	// 	`https://stockx.com/api/browse?&_search=${query}&dataType=product`,
	// 	'GET',
	// 	headers
	// )
	// 	.then((result) => {
	// 		console.log(result);
	// 	})
	// 	.catch((err) => {
	// 		console.log(err);
	// 	});

	fetch(`https://stockx.com/api/browse?&_search=${query}&dataType=product`, {
		method: 'get',
		headers: headers,
		// body: 'foo=bar&lorem=ipsum',
	})
		.then((res) => res.json())
		.then(function (data) {
			console.log('Request succeeded with JSON response', data);
		})
		.catch(function (error) {
			console.log('Request failed', error);
		});
});

// url: string,
// method: 'GET' | 'POST',
// headers: object,
// body?: string

const sendRequest = async (url, method, headers, body) => {
	const axiosInstance = axios.create({});
	axiosInstance.defaults.raxConfig = {
		instance: axiosInstance,
	};
	rax.attach(axiosInstance);

	try {
		const res = await axiosInstance({
			url: url,
			method: method,
			headers: headers,
			// data: body,
			timeout: 20000,
			raxConfig: {
				retry: 3,
				noResponseRetries: 3,
				retryDelay: 100,
				httpMethodsToRetry: ['GET', 'HEAD', 'OPTIONS', 'DELETE', 'PUT'],
				statusCodesToRetry: [
					[100, 199],
					[429, 429],
					[500, 599],
				],
				backoffType: 'linear',
				onRetryAttempt: (err) => {
					const cfg = rax.getConfig(err);
					console.log(`Retry attempt #${cfg?.currentRetryAttempt}`);
				},
			},
		});
		console.log('sup');
		console.log(res);
		return res?.data ?? [];
	} catch (err) {
		console.log('sup');
		console.log(err);
		return [];
	}
};
