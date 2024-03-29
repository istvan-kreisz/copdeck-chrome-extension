import React from 'react'
import { useEffect, useState, useRef } from 'react'
import { assert } from 'superstruct'
import { Item, Store, Currency, ALLSTORES, ExchangeRates } from 'copdeck-scraper/dist/types'
import { bestStoreInfo } from 'copdeck-scraper'
import AddAlertModal from '../Popup/Main/AddAlertModal'
import { ChevronLeftIcon, RefreshIcon, QuestionMarkCircleIcon } from '@heroicons/react/outline'
import LoadingIndicator from '../Components/LoadingIndicator'
import Popup from '../Components/Popup'
import { databaseCoordinator } from '../services/databaseCoordinator'

const ItemDetail = (prop: {
	selectedItem: Item
	setSelectedItem: (callback: (item: Item | null | undefined) => Item | null | undefined) => void
	currency: Currency
	setToastMessage: React.Dispatch<
		React.SetStateAction<{
			message: string
			show: boolean
		}>
	>
}) => {
	const container = useRef<HTMLDivElement>(null)
	const [showAddPriceAlertModal, setShowAddPriceAlertModal] = useState(false)
	const [priceType, setPriceType] = useState<'ask' | 'bid'>('ask')
	const didClickBack = useRef(false)
	const [exchangeRates, setExchangeRates] = useState<ExchangeRates>()

	const { getExchangeRates } = databaseCoordinator()

	const [telltipMessage, setTelltipMessage] = useState<{
		title: string
		message: JSX.Element | string
		show: boolean
	}>({
		title: '',
		message: '',
		show: false,
	})

	const [isLoadingPrices, setIsLoadingPrices] = useState(false)

	const storeInfo = bestStoreInfo(prop.selectedItem)

	const updateItem = (forceRefresh: boolean) => {
		setIsLoadingPrices(true)
		chrome.runtime.sendMessage(
			{ getItemDetails: { item: prop.selectedItem, forceRefresh: forceRefresh } },
			(item) => {
				try {
					assert(item, Item)
					if (!didClickBack.current) {
						prop.setSelectedItem((current) => (current ? item : null))
					}
				} catch {}
				setIsLoadingPrices(false)
			}
		)
	}

	useEffect(() => {
		didClickBack.current = false
		if (prop.selectedItem) {
			updateItem(false)
		}
		;(async () => {
			const rates = await getExchangeRates()
			if (rates) {
				setExchangeRates(rates)
			}
		})()
	}, [])

	useEffect(() => {
		if (!showAddPriceAlertModal) {
			if (container.current) {
				container.current.scrollTo(0, 0)
			}
		}
	}, [showAddPriceAlertModal])

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

	const price = (size: string, store: Store): [string, number] => {
		const prices = allStores
			.find((s) => s.store.id === store.id)
			?.inventory.find((inventoryItem) => inventoryItem.size === size)
		let price = priceType === 'ask' ? prices?.lowestAsk : prices?.highestBid
		if (price) {
			if (store.id === 'goat' && prop.currency.code !== 'USD') {
				if (exchangeRates) {
					switch (prop.currency.code) {
						case 'EUR':
							price = Math.round(price / exchangeRates.usd)
							break
						case 'GBP':
							price = Math.round((price / exchangeRates.usd) * exchangeRates.gbp)
					}
					return [prop.currency.symbol + price, price]
				} else {
					return ['-', 0]
				}
			} else {
				return [prop.currency.symbol + price, price]
			}
		} else {
			return ['-', 0]
		}
	}

	const prices = (size: string): { prices: { text: string; store: Store }[]; best?: Store } => {
		const prices = ALLSTORES.map((store) => {
			const p = price(size, store)
			return {
				priceText: p[0],
				price: p[1],
				store: store,
			}
		})
		const realPrices = prices.filter((price) => price.priceText !== '-')
		let best: Store | undefined
		if (realPrices.length) {
			best = realPrices.reduce((prev, current) => {
				return prev.price < current.price ? prev : current
			})?.store
		}

		return {
			best: best,
			prices: prices.map((p) => {
				return {
					text: p.priceText,
					store: p.store,
				}
			}),
		}
	}

	const priceClicked = (store: Store) => {
		const storeInfo = prop.selectedItem.storeInfo.find((s) => s.store.id === store.id)
		if (storeInfo) {
			chrome.tabs.create({
				url: storeInfo.url,
			})
		}
	}

	return (
		<>
			<div
				ref={container}
				className="flexbg-white bg-gray-100 flex-col fixed inset-0 overflow-y-scroll"
			>
				<section className="relative bg-white w-screen h-48 ">
					<img
						className="w-48 h-full object-contain mx-auto"
						src={prop.selectedItem.imageURL?.url}
						style={
							prop.selectedItem.imageURL?.store.id === 'klekt'
								? { transform: 'scaleX(-1)' }
								: {}
						}
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
									{prop.selectedItem.retailPrice
										? prop.currency.symbol + prop.selectedItem.retailPrice
										: '-'}
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
							<p className="text-xs">Tap store's name to visit website</p>
						</div>
						<div className="flex-shrink flex-grow"></div>
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
					<div className="mt-1 mb-6 flex flex-row items-center space-x-1">
						<button
							onClick={updateItem.bind(null, true)}
							className="flex flex-row cursor-pointer focus:outline-none space-x-1 justify-center items-center"
						>
							<RefreshIcon className="font-bold h-4 text-theme-orange flex-shrink-0"></RefreshIcon>
							<p className="text-theme-orange">Refresh prices</p>
						</button>
						<QuestionMarkCircleIcon
							onClick={setTelltipMessage.bind(null, {
								title: 'Price refresh',
								message: `Prices will automatically get refreshed based on your "Refresh frequency" setting on the Settings tab. You can also manually refresh them using this button, but doing so too frequently (without using proxies) might get your IP blocked by the site.`,
								show: true,
							})}
							className="h-4 cursor-pointer text-gray-800 font-semibold flex-shrink-0"
						></QuestionMarkCircleIcon>
					</div>

					<ul className="bg-white w-full flex flex-col space-y-2 mt-1">
						<li key={'header'} className="flex flex-row space-x-4">
							<p className="h-7 rounded-full flex justify-center items-center w-16">
								Sizes
							</p>
							{ALLSTORES.map((store) => {
								return (
									<p
										onClick={priceClicked.bind(null, store)}
										key={store.id}
										className="h-7 text-gray-800 text-lg font-bold rounded-full flex justify-center items-center w-16 cursor-pointer"
									>
										{store.name}
									</p>
								)
							})}
							<p className="flex-grow"></p>
						</li>

						{!isLoadingPrices
							? allSizes
									.map((size) => {
										return { size: size, prices: prices(size) }
									})
									.map((row) => {
										return (
											<li key={row.size} className="flex flex-row space-x-4">
												<p className="bg-gray-300 h-7 rounded-full flex justify-center items-center w-16">
													{row.size}
												</p>
												{row.prices.prices.map((price) => {
													return (
														<div
															className={`h-7 space-x-1 rounded-full flex flex-row justify-center items-center w-16 ${
																price.text !== '-' &&
																price.store.id ===
																	row.prices.best?.id
																	? 'border-2 border-green-500'
																	: 'border-2 border-white'
															}`}
															key={price.store.id}
														>
															<p>{price.text}</p>
															{price.store.id === 'goat' &&
															price.text !== '-' ? (
																<QuestionMarkCircleIcon
																	onClick={setTelltipMessage.bind(
																		null,
																		{
																			title: 'GOAT prices',
																			message: (
																				<ul className="list-inside text-left">
																					<li>
																						*GOAT prices
																						always show
																						the price
																						for new
																						items with
																						undamaged
																						boxes and
																						regular
																						shipping. To
																						visit their
																						website for
																						more price
																						options
																						click on
																						"GOAT" in
																						the first
																						row.
																					</li>
																					<br />
																					<li>
																						*GOAT
																						provides
																						prices in
																						USD so the
																						EUR and GBP
																						prices are
																						only
																						estimates
																						based on
																						standard
																						exchange
																						rates and
																						may differ
																						from the
																						amount you
																						pay at
																						checkout
																					</li>
																				</ul>
																			),
																			show: true,
																		}
																	)}
																	className="h-3 cursor-pointer text-gray-900 font-bold flex-shrink-0"
																></QuestionMarkCircleIcon>
															) : null}
														</div>
													)
												})}
												<p className="flex-grow"></p>
											</li>
										)
									})
							: null}
					</ul>
					<div className="mt-6 ml-4 mb-3">
						{isLoadingPrices ? (
							<LoadingIndicator
								key="loading"
								title="Loading Prices"
							></LoadingIndicator>
						) : null}
					</div>
				</section>
				<section className="bg-white w-screen p-3">
					{prop.selectedItem.storePrices.length ? (
						<button
							style={{ fontWeight: 'normal' }}
							className="-mt-3 mb-4 mx-auto button-default h-9 flex-shrink-0 flex-grow-0 rounded-full font-thin bg-black text-white"
							onClick={setShowAddPriceAlertModal.bind(null, true)}
						>
							Add price alert
						</button>
					) : null}
				</section>
			</div>

			{showAddPriceAlertModal ? (
				<AddAlertModal
					currency={prop.currency}
					selectedItem={prop.selectedItem}
					showAddPriceAlertModal={showAddPriceAlertModal}
					setShowAddPriceAlertModal={setShowAddPriceAlertModal}
					setToastMessage={prop.setToastMessage}
				></AddAlertModal>
			) : null}
			<Popup
				title={telltipMessage?.title}
				message={telltipMessage?.message}
				open={telltipMessage?.show}
				close={setTelltipMessage.bind(null, {
					title: telltipMessage?.title ?? '',
					message: telltipMessage?.message ?? '',
					show: false,
				})}
			></Popup>
		</>
	)
}

export default ItemDetail
