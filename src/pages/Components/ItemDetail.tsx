import React from 'react'
import { useEffect, useState, useRef } from 'react'
import { assert } from 'superstruct'
import { Item } from 'copdeck-scraper/dist/types'
import { itemImageURL, itemBestPrice, bestStoreInfo } from 'copdeck-scraper'
import AddAlertModal from '../Popup/Main/AddAlertModal'
import { ChevronLeftIcon } from '@heroicons/react/outline'

const ItemDetail = (prop: {
	selectedItem: Item
	setSelectedItem: (callback: (item: Item | null | undefined) => Item | null | undefined) => void
}) => {
	const [showAddPriceAlertModal, setShowAddPriceAlertModal] = useState(false)
	const [priceType, setPriceType] = useState<'ask' | 'bid'>('ask')
	const didClickBack = useRef(false)

	const storeInfo = bestStoreInfo(prop.selectedItem)

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

	// todo: check retail price

	return (
		<>
			<div className="flexbg-white bg-gray-100 flex-col fixed inset-0 overflow-y-scroll">
				<section className="relative bg-white w-screen h-48 ">
					<img
						className="w-48 h-full object-contain mx-auto"
						src={itemImageURL(prop.selectedItem)}
						alt=""
					/>
					<button
						onClick={backClicked}
						className="cursor-pointer flex h-8 w-8 bg-black absolute top-6 left-6 rounded-full justify-center items-center"
					>
						<ChevronLeftIcon className="font-bold h-5 text-white flex-shrink-0"></ChevronLeftIcon>
					</button>
				</section>
				<section className="p-3">
					<p>{storeInfo?.brand?.toUpperCase()}</p>
					<h1 className="my-2 font-bold">{prop.selectedItem.name}</h1>
					<div className="my-4 flex flex-row justify-around">
						<div className="flex flex-col items-center">
							<p className="text-gray-800 font-bold text-base m-0">
								{prop.selectedItem.id}
							</p>
							<p className="m-0">Style</p>
						</div>
						{prop.selectedItem.retailPrice ? (
							<div className="flex flex-col items-center">
								<p className="text-gray-800 font-bold text-base m-0">
									{prop.selectedItem.retailPrice}
								</p>
								<p className="m-0">Retail Price</p>
							</div>
						) : null}
					</div>
				</section>
				<section className="bg-white w-screen p-3">
					<div className="flex flex-row space-x-2 justify-between items-center flex-nowrap">
						<div className="flex flex-col">
							<h3 className="text-base">Price comparison</h3>
							<p className="text-xs">Tap price to visit website</p>
						</div>
						<button
							className={`button-default h-8 flex-shrink-0 flex-grow-0 rounded-full border-2 border-theme-blue ${
								priceType === 'ask'
									? 'bg-theme-blue text-white'
									: 'text-gray-800 border-2'
							}`}
							onClick={setPriceType.bind(null, 'ask')}
						>
							Ask
						</button>
						<button
							className={`button-default h-8 flex-shrink-0 flex-grow-0 rounded-full border-2 border-theme-blue ${
								priceType === 'bid' ? 'bg-theme-blue text-white' : 'text-gray-800'
							}`}
							onClick={setPriceType.bind(null, 'bid')}
						>
							Bid
						</button>
					</div>
					<ul className="bg-white w-screen">
						{prop.selectedItem.storePrices.map((storePrice) => {
							return (
								<li key={storePrice.store}>
									<h3>{storePrice.store}</h3>
									<ul>
										{storePrice.inventory
											.sort((a, b) => {
												const regex = /[\d|,|.|e|E|\+]+/g
												const aNum = parseFloat(
													a.size.match(regex)?.[0] ?? ''
												)
												const bNum = parseFloat(
													b.size.match(regex)?.[0] ?? ''
												)
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
				</section>
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
