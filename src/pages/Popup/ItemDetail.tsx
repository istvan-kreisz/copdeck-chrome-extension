import React from 'react'
import { useEffect, useState, useRef } from 'react'
import { assert } from 'superstruct'
import { Item } from 'copdeck-scraper/dist/types'
import { itemImageURL, itemBestPrice } from 'copdeck-scraper'
import AddAlertModal from './Main/AddAlertModal'

const ItemDetail = (prop: {
	selectedItem: Item
	setSelectedItem: (callback: (item: Item | null | undefined) => Item | null | undefined) => void
}) => {
	const [showAddPriceAlertModal, setShowAddPriceAlertModal] = useState(false)
	const didClickBack = useRef(false)

	useEffect(() => {
		didClickBack.current = false
		if (prop.selectedItem && prop.selectedItem.storePrices.length == 0) {
			chrome.runtime.sendMessage({ getItemDetails: prop.selectedItem }, (item) => {
				assert(item, Item)
				if (!didClickBack.current) {
					prop.setSelectedItem((current) => (current ? item : null))
				}
			})
		}
	}, [])

	const backClicked = () => {
		didClickBack.current = true
		prop.setSelectedItem(() => null)
	}

	return (
		<>
			<div
				style={{
					position: 'fixed',
					left: 0,
					right: 0,
					bottom: 0,
					top: 0,
					display: 'flex',
					flexDirection: 'column',
					backgroundColor: 'blue',
					justifyItems: 'center',
					padding: '1rem',
					overflow: 'scroll',
				}}
			>
				<button onClick={backClicked}> Back</button>
				<img src={itemImageURL(prop.selectedItem)} alt="" />
				<h1>{prop.selectedItem.name}</h1>
				<h2>{prop.selectedItem.id}</h2>
				<p>{prop.selectedItem.retailPrice}</p>
				<ul>
					{prop.selectedItem.storePrices.map((storePrice) => {
						return (
							<li key={storePrice.store}>
								<h3>{storePrice.store}</h3>
								<ul>
									{storePrice.inventory
										.sort((a, b) => {
											const regex = /[\d|,|.|e|E|\+]+/g
											const aNum = parseFloat(a.size.match(regex)?.[0] ?? '')
											const bNum = parseFloat(b.size.match(regex)?.[0] ?? '')
											if (aNum < bNum) return -1
											if (aNum > bNum) return 1
											return 0
										})
										.map((inventoryItem) => {
											return (
												<li
													key={inventoryItem.size}
												>{`${inventoryItem.size} ${inventoryItem.lowestAsk}`}</li>
											)
										})}
								</ul>
							</li>
						)
					})}
				</ul>
				{prop.selectedItem.storePrices.length ? (
					<button onClick={setShowAddPriceAlertModal.bind(null, true)}>
						Add Price Alert
					</button>
				) : null}
			</div>
			{showAddPriceAlertModal ? (
				<AddAlertModal
					selectedItem={prop.selectedItem}
					showAddPriceAlertModal={showAddPriceAlertModal}
					setShowAddPriceAlertModal={setShowAddPriceAlertModal}
				></AddAlertModal>
			) : null}
		</>
	)
}

export default ItemDetail
