import React from 'react';
import logo from '../../assets/img/logo.svg';
import Greetings from '../../containers/Greetings/Greetings';
import './Popup.css';
import  { useRef, useEffect, useState } from 'react'
import { assert, string, number, array } from 'superstruct';

const Popup = () => {
    const [searchResults, setSearchResults] = useState([])
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
                if (key === 'names') {
                    assert(newValue, array(string()))
                    setSearchResults(newValue)
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