import React from 'react'
import { useState, useRef, useEffect } from 'react'
import { assert } from 'superstruct'
import { Settings, Currency } from '../../utils/types'
import { databaseCoordinator } from '../../services/databaseCoordinator'

const SettingsTab = () => {
	const currencies = ['EUR', 'USD']

	const proxyTextField = useRef<HTMLTextAreaElement>(null)
	const currencySelector = useRef<HTMLDivElement>(null)

	const [updateInterval, setUpdateInterval] = useState('5')
	const [notificationFrequency, setNotificationFrequency] = useState('24')
	const [selectedCurrency, setSelectedCurrency] = useState<Currency['code']>('EUR')

	const { listenToSettingsChanges } = databaseCoordinator()

	useEffect(() => {
		;(async () => {
			await listenToSettingsChanges((settings) => {
				console.log(settings)
				setSelectedCurrency(settings.currency)

				const proxyField = proxyTextField.current
				if (proxyField) {
					proxyField.value = settings.proxies ?? ''
				}

				setNotificationFrequency(`${settings.notificationFrequency}`)
				setUpdateInterval(`${settings.updateInterval}`)
			})
		})()
	}, [])

	const saveSettings = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		const interval = parseFloat(updateInterval ?? '')
		const notificationInterval = parseFloat(notificationFrequency ?? '24')

		chrome.runtime.sendMessage({
			settings: {
				proxies: proxyTextField.current?.value,
				currency: selectedCurrency,
				updateInterval: interval,
				notificationFrequency: notificationInterval,
			},
		})
	}

	const changedInterval = (event: { target: HTMLInputElement }) => {
		setUpdateInterval(event.target.value)
	}

	const changedNotificationFrequency = (event: { target: HTMLInputElement }) => {
		setNotificationFrequency(event.target.value)
	}

	const changedCurrency = (event: { target: HTMLInputElement }) => {
		setSelectedCurrency(event.target.value as Currency['code'])
	}

	const clickedContact = () => {
		chrome.tabs.create({ url: 'https://copdeck.com/contact' })
	}

	return (
		<div className="bg-gray-100 p-3 w-full h-full overflow-y-scroll overflow-x-hidden">
			<h1 key="header" className="font-bold mb-4">
				Settings
			</h1>

			<form key="form" onSubmit={saveSettings} className="flex flex-col">
				<h3 className="text-base font-bold mt-0 mb-1">Currency</h3>

				<div className="flex flex-row space-x-2 items-start" ref={currencySelector}>
					{currencies.map((currency) => {
						return (
							<div
								key={currency}
								className="flex flex-row items-center space-x-2 m-0"
							>
								<label className="text-lg text-gray-800 m-0" htmlFor={currency}>
									{currency}
								</label>

								<input
									type="radio"
									id={currency}
									name="currency"
									value={currency}
									checked={currency === selectedCurrency}
									onChange={changedCurrency}
									className="h-5 w-5 text-theme-blue rounded-full m-0"
								/>
							</div>
						)
					})}
				</div>

				<h3 className="text-base font-bold mt-2 mb-1">Proxies</h3>

				<textarea
					ref={proxyTextField}
					style={{ resize: 'none' }}
					id="proxies"
					placeholder="Add a list of proxies here, separated by commas"
					name="proxies"
					rows={2}
					className="w-full bg-white rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none leading-6"
				></textarea>

				<h3 className="text-base font-bold mt-2 mb-1">Refresh interval</h3>

				<label htmlFor="pricefield">{`${updateInterval} mins`}</label>

				<input
					type="range"
					min="5"
					max="1440"
					className="focus:outline-none slider w-full bg-white rounded-xl border  border-theme-blue text-base outline-none leading-6"
					id="myRange"
					value={updateInterval}
					onChange={changedInterval}
				/>

				<h3 className="text-base font-bold mt-2 mb-1">Notification Frequency</h3>

				<label htmlFor="pricefield">{`${notificationFrequency} hours`}</label>

				<input
					type="range"
					min="1"
					max="168"
					className="focus:outline-none slider w-full bg-white rounded-xl border  border-theme-blue text-base outline-none leading-6"
					id="notificationFrequency"
					value={notificationFrequency}
					onChange={changedNotificationFrequency}
				/>

				<input
					className="mt-4 w-full button-default text-white bg-theme-orange hover:bg-theme-orange-dark rounded-lg bg h-10 shadow-md border-transparent"
					type="submit"
					value="Save Settings"
				/>
			</form>
			<div className="mt-5 mb-2 border border-gray-300"></div>
			<div className="flex flex-row flex-nowrap items-center">
				<h3 className="text-lg font-bold text-gray-600">Got questions?</h3>
				<button
					onClick={clickedContact}
					className="button-default text-theme-blue border-transparent underline"
					type="submit"
				>
					Contact us!
				</button>
			</div>
		</div>
	)
}

export default SettingsTab
