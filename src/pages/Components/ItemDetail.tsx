import React from 'react'
import { useEffect, useState, useRef } from 'react'
import { assert } from 'superstruct'
import { Item, Store, STOCKX, KLEKT } from 'copdeck-scraper/dist/types'
import { itemImageURL, bestStoreInfo } from 'copdeck-scraper'
import AddAlertModal from '../Popup/Main/AddAlertModal'
import { ChevronLeftIcon } from '@heroicons/react/outline'
import { Currency } from '../utils/types'

const ItemDetail = (prop: {
	selectedItem: Item
	setSelectedItem: (callback: (item: Item | null | undefined) => Item | null | undefined) => void
	currency: Currency
}) => {
	// todo
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

	const sizeSet = new Set<string>()
	const allStores =
		prop.selectedItem?.storePrices.filter((prices) => prices.inventory.length) ?? []
	allStores.forEach((store) => {
		return store.inventory.map((inventoryItem) => {
			sizeSet.add(inventoryItem.size)
		})
	})
	const allSizes = Array.from(sizeSet).sort((a, b) => {
		const regex = /[\d|,|.|e|E|\+]+/g
		const aNum = parseFloat(a.match(regex)?.[0] ?? '')
		const bNum = parseFloat(b.match(regex)?.[0] ?? '')
		if (aNum < bNum) return -1
		if (aNum > bNum) return 1
		return 0
	})

	const price = (size: string, store: Store): string => {
		const prices = allStores
			.find((s) => s.store.id === store.id)
			?.inventory.find((inventoryItem) => inventoryItem.size === size)
		let price = priceType === 'ask' ? prices?.lowestAsk : prices?.highestBid
		if (price) {
			return prop.currency.symbol + price
		} else {
			return '-'
		}
	}

	const prices = (size: string): { stockx: string; klekt: string } => {
		const stockxPrice = price(size, STOCKX)
		const klektPrice = price(size, KLEKT)
		return { stockx: stockxPrice, klekt: klektPrice }
	}

	const priceClicked = (store: Store) => {
		const storeInfo = prop.selectedItem.storeInfo.find((s) => s.store === store)
		if (storeInfo) {
			chrome.tabs.create({ url: `https://${storeInfo.store}.com/product/${storeInfo.slug}` })
		}
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
					<ul className="bg-white w-full flex flex-col space-y-2 mt-8">
						<li key={'header'} className="flex flex-row space-x-4">
							<p className="h-7 rounded-full flex justify-center items-center w-16">
								Sizes
							</p>
							<p className="h-7 text-gray-800 text-lg font-bold rounded-full flex justify-center items-center w-16">
								StockX
							</p>
							<p className="h-7 text-gray-800 text-lg font-bold rounded-full flex justify-center items-center w-16">
								Klekt
							</p>
							<p className="flex-grow"></p>
						</li>

						{allSizes
							.map((size) => {
								return { size: size, prices: prices(size) }
							})
							.map((row) => {
								return (
									<li key={row.size} className="flex flex-row space-x-4">
										<p className="bg-gray-300 h-7 rounded-full flex justify-center items-center w-16">
											{row.size}
										</p>
										<p
											onClick={priceClicked.bind(null, {
												name: 'StockX',
												id: 'stockx',
											})}
											className={`h-7 rounded-full cursor-pointer flex justify-center items-center w-16 ${
												row.prices.stockx &&
												(row.prices.stockx ?? 0) > (row.prices.klekt ?? 0)
													? 'border-2 border-green-500'
													: 'border-2 border-white'
											}`}
										>
											{row.prices.stockx}
										</p>
										<p
											onClick={priceClicked.bind(null, {
												name: 'Klekt',
												id: 'klekt',
											})}
											className={`h-7 rounded-full cursor-pointer flex justify-center items-center w-16 ${
												row.prices.klekt &&
												(row.prices.klekt ?? 0) > (row.prices.stockx ?? 0)
													? 'border-2 border-green-500'
													: 'border-2 border-white'
											}`}
										>
											{row.prices.klekt}
										</p>
										<p className="flex-grow"></p>
									</li>
								)
							})}
					</ul>
				</section>
				<section className="bg-white w-screen p-3">
					{prop.selectedItem.storePrices.length ? (
						<button
							style={{ fontWeight: 'normal' }}
							className="mx-auto button-default h-9 flex-shrink-0 flex-grow-0 rounded-full font-thin bg-black text-white"
							onClick={setShowAddPriceAlertModal.bind(null, true)}
						>
							Add price alert
						</button>
					) : null}
				</section>
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
