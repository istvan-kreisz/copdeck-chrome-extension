import React from 'react'
// import './Popup.css'
import { useState, useRef } from 'react'
import { assert, array } from 'superstruct'
import { Item } from 'copdeck-scraper/dist/types'
import ItemDetail from '../ItemDetail'

const MainTab = () => {
	const [searchResults, setSearchResults] = useState<Item[]>([])
	const [selectedItem, setSelectedItem] = useState<Item | null>()

	const searchBar = useRef<HTMLInputElement>(null)

	const search = () => {
		if (searchBar.current?.value) {
			chrome.runtime.sendMessage({ search: searchBar.current?.value }, (response) => {
				assert(response, array(Item))
				setSearchResults(response)
			})
		}
	}

	const clickedItem = (item: Item) => {
		if (item.id !== selectedItem?.id) {
			setSelectedItem(item)
		}
	}

	return (
		<div style={{ height: '400px' }}>
			<input ref={searchBar} type="text" />
			<button onClick={search}>Search yeezys</button>
			<ul className="searchResults">
				{searchResults.map((item, index) => {
					return (
						<li
							onClick={clickedItem.bind(null, item)}
							className="searchResult"
							key={item.id}
						>
							{item.name}
						</li>
					)
				})}
			</ul>
			{selectedItem ? (
				<ItemDetail
					selectedItem={selectedItem}
					setSelectedItem={setSelectedItem}
				></ItemDetail>
			) : null}
		</div>
	)
}

export default MainTab
