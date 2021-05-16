import React from 'react';
import logo from '../../assets/img/logo.svg';
import Greetings from '../../containers/Greetings/Greetings';
import './Popup.css';

const Popup = () => {
	return (
		<div className="App">
			<header className="App-header">
				<h1>yasdsdso</h1>
				{/* <a
					className="App-link"
					href="https://reactjs.org"
					target="_blank"
					rel="noopener noreferrer"
				>
					Learn React!
				</a> */}
			</header>
		</div>
	);
};

export default Popup;

// let changeColor = document.getElementById('changeColor');

// chrome.storage.sync.get('color', ({ color }) => {
// 	changeColor.style.backgroundColor = color;
// });

// // When the button is clicked, inject setPageBackgroundColor into current page
// changeColor.addEventListener('click', async () => {
// 	let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

// 	chrome.scripting.executeScript({
// 		target: { tabId: tab.id },
// 		function: setPageBackgroundColor,
// 	});
// });

// // The body of this function will be execuetd as a content script inside the
// // current page
// function setPageBackgroundColor() {
// 	chrome.storage.sync.get('color', ({ color }) => {
// 		document.body.style.backgroundColor = color;
// 	});
// }

// "action": {
// 	"default_popup": "popup.html",
// 	"default_icon": {
// 		"16": "/images/get_started16.png",
// 		"32": "/images/get_started32.png",
// 		"48": "/images/get_started48.png",
// 		"128": "/images/get_started128.png"
// 	}
// },
// "icons": {
// 	"16": "/images/get_started16.png",
// 	"32": "/images/get_started32.png",
// 	"48": "/images/get_started48.png",
// 	"128": "/images/get_started128.png"
// },
