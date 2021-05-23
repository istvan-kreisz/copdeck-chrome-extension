import React from 'react'
import MainTab from './Main/MainTab'
import SettingsTab from './Settings/SettingsTab'
import AlertsTab from './Alerts/AlertsTab'
import { useState, useEffect } from 'react'
import { Currency, Settings } from '../utils/types'
import { assert, array, is, union, literal } from 'superstruct'
import { SearchIcon, CogIcon, BellIcon, DeviceMobileIcon } from '@heroicons/react/outline'

const Popup = () => {
	// todo: set to main
	const [activeTab, setActiveTab] = useState<'main' | 'settings' | 'alerts'>('main')
	const [currency, setCurrency] = useState<Currency>({ code: 'EUR', symbol: '€' })

	useEffect(() => {
		chrome.storage.onChanged.addListener(function (changes, namespace) {
			const settings = changes.settings?.newValue
			if (settings) {
				assert(settings, Settings)
				setCurrency(
					settings.currency === 'EUR'
						? {
								code: settings.currency,
								symbol: '€',
						  }
						: { code: settings.currency, symbol: '$' }
				)
			}
		})
	}, [])

	const selectedTab = (tab: 'main' | 'settings' | 'alerts') => {
		setActiveTab(tab)
	}

	const clickedLink = () => {
		chrome.tabs.create({ url: 'https://copdeck.com' })
	}

	return (
		<div className="gap-0 grid grid-row-3 absolute top-0 left-0 right-0 bottom-0 text-left">
			<main className="bg-transparent relative w-full h-96">
				<div className={`h-full ${activeTab === 'settings' ? 'block' : 'hidden'}`}>
					<SettingsTab></SettingsTab>
				</div>
				<div className={`h-full ${activeTab === 'main' ? 'block' : 'hidden'}`}>
					<MainTab currency={currency}></MainTab>
				</div>
				<div className={`h-full ${activeTab === 'alerts' ? 'block' : 'hidden'}`}>
					<AlertsTab currency={currency} activeTab={activeTab}></AlertsTab>
				</div>
			</main>
			<section className="bg-white w-full flex h-12 border-gray-400 shadow-xl">
				<button
					className={`outline-none group focus:outline-none flex-1 ${
						activeTab === 'settings' ? 'bg-gray-200 shadow-xl' : ''
					}`}
					onClick={selectedTab.bind(null, 'settings')}
				>
					<CogIcon
						className={`mx-auto text-center h-6 w-6 ${
							activeTab === 'settings' ? 'text-gray-800' : 'text-gray-500'
						}`}
						aria-hidden="true"
					></CogIcon>
					<p
						className={`text-xs font-medium ${
							activeTab === 'settings' ? 'text-gray-800' : 'text-gray-500'
						}`}
					>
						Settings
					</p>
				</button>
				<button
					className={`outline-none group focus:outline-none flex-1 ${
						activeTab === 'main' ? 'bg-gray-200 shadow-xl' : ''
					}`}
					onClick={selectedTab.bind(null, 'main')}
				>
					<SearchIcon
						className={`mx-auto text-center h-6 w-6 ${
							activeTab === 'main' ? 'text-gray-800' : 'text-gray-500'
						}`}
						aria-hidden="true"
					></SearchIcon>
					<p
						className={`text-xs font-medium ${
							activeTab === 'main' ? 'text-gray-800' : 'text-gray-500'
						}`}
					>
						Search
					</p>
				</button>
				<button
					className={`outline-none group focus:outline-none flex-1 ${
						activeTab === 'alerts' ? 'bg-gray-200 shadow-xl' : ''
					}`}
					onClick={selectedTab.bind(null, 'alerts')}
				>
					<BellIcon
						className={`mx-auto text-center h-6 w-6 ${
							activeTab === 'alerts' ? 'text-gray-800' : 'text-gray-500'
						}`}
						aria-hidden="true"
					></BellIcon>
					<p
						className={`text-xs font-medium ${
							activeTab === 'alerts' ? 'text-gray-800' : 'text-gray-500'
						}`}
					>
						Alerts
					</p>
				</button>
			</section>
			<footer className="h-8 w-full bg-theme-yellow flex-grow-0">
				<a
					onClick={clickedLink}
					className="w-full h-full flex space-x-1 flex-row align-middle items-center justify-center"
					href="https://copdeck.com"
				>
					<DeviceMobileIcon
						className="text-center h-6 text-gray-800"
						aria-hidden="true"
					></DeviceMobileIcon>

					<p className="text-gray-800 font-bold">Coming soon to iOS! Click for more!</p>
				</a>
			</footer>
		</div>
	)
}

export default Popup
