import React from 'react';
import logo from '../../assets/img/logo.svg';
import Greetings from '../../containers/Greetings/Greetings';
import './Popup.css';
import  { useRef, useEffect, useState } from 'react'
import { assert, string, number, array } from 'superstruct';
import { Item } from 'copdeck-scraper/dist/types';

const Popup = () => {
    const [searchResults, setSearchResults] = useState<Array<Item>>([])
    const searchBar = useRef()

    const search = () => {
        if (searchBar.current.value) {
            chrome.runtime.sendMessage( {search: searchBar.current.value }, response => {
                console.log(response);
            });
        }
    }

    useEffect(() => {
        chrome.storage.onChanged.addListener(function (changes, namespace) {
            for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
                if (key === 'searchResults') {
                    assert(newValue, string())
                    const parsedItems = JSON.parse(newValue)
                    assert(parsedItems, array(Item))
                    setSearchResults(parsedItems)
                }
            }
        });
    }, [])

	return (
		<div className="App">
			<header className="App-header">
			</header>
            <main>
                <input ref={searchBar} type="text" />
                <button onClick={search}>Search yeezys</button>
                <ul className="searchResults">
                    {searchResults.map((searchResult, index) => {
                        return <li className="searchResult" key={index}>{searchResult}</li>
                    })}
                </ul>

            </main>
		</div>
	);
};

export default Popup;