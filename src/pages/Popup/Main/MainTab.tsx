import React from 'react'
import { useState, useRef } from 'react'
import { array, is } from 'superstruct'
import { Item } from 'copdeck-scraper/dist/types'
import { itemImageURL } from 'copdeck-scraper'
import ItemDetail from '../../Components/ItemDetail'
import LoadingIndicator from '../../Components/LoadingIndicator'
import MainListItem from './MainListItem'

const MainTab = () => {
	const [searchState, setSearchState] = useState<Item[] | null | 'searching'>(null)
	const [selectedItem, setSelectedItem] = useState<Item | null>()

	const searchBar = useRef<HTMLInputElement>(null)

	const search = () => {
		setSearchState('searching')
		if (searchBar.current?.value) {
			chrome.runtime.sendMessage({ search: searchBar.current?.value }, (response) => {
				if (is(response, array(Item))) {
					if (response.length) {
						setSearchState(response)
					} else {
						setSearchState([])
					}
				} else {
					setSearchState([])
				}
			})
		}
	}

	const clickedItem = (item: Item) => {
		if (item.id !== selectedItem?.id) {
			setSelectedItem(item)
		}
	}

	const handleKeyDown = (event) => {
		if (event.key === 'Enter') {
			search()
		}
	}

	return (
		<div className="bg-transparent p-3 pb-0 relative h-full overflow-y-scroll">
			<div className="flex flex-row flex-nowrap w-full space-x-2">
				<input
					placeholder="Search sneakers"
					className="h-10 flex-grow rounded-lg focus:outline-none shadow-md px-3 text-md"
					ref={searchBar}
					type="text"
					onKeyDown={handleKeyDown}
				/>
				<button className="button-default h-10 shadow-md" onClick={search}>
					Search
				</button>
			</div>
			<ul className="searchState my-4 flex flex-col space-y-3 ">
				{searchState === 'searching' ? <LoadingIndicator></LoadingIndicator> : null}
				{typeof searchState === 'object' && searchState && searchState['length'] === 0 ? (
					<p>No Results</p>
				) : null}
				{typeof searchState === 'object'
					? (searchState as Item[])?.map((item, index) => {
							return (
								<MainListItem
									name={item.name}
									imageURL={itemImageURL(item)}
									currency={'USD'}
									id={item.id}
									onClicked={clickedItem.bind(null, item)}
								>
									<p>{item.name}</p>
								</MainListItem>
							)
					  })
					: null}
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
