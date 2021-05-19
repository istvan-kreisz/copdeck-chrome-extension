import React from 'react'
import './Popup.css'
import { useEffect, useState } from 'react'
import { assert } from 'superstruct'
import { Item } from 'copdeck-scraper/dist/types'
import AddAlertModal from './AddAlertModal'

const ItemDetail = (prop: { selectedItem: Item; setSelectedItem: (item: Item | null) => void }) => {
	const [showAddPriceAlertModal, setShowAddPriceAlertModal] = useState(false)

	useEffect(() => {
		if (prop.selectedItem && prop.selectedItem.storePrices.length == 0) {
			chrome.runtime.sendMessage({ getItemDetails: prop.selectedItem }, (item) => {
				assert(item, Item)
				prop.setSelectedItem(item)
			})
		}
	}, [prop.selectedItem])

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
				<button onClick={prop.setSelectedItem.bind(null, null)}> Back</button>
				<img src={prop.selectedItem.storeInfo?.[0].imageURL ?? ''} alt="" />
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
