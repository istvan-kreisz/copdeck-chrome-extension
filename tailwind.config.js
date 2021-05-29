module.exports = {
	purge: [
		'./src/pages/Components/**/*.{js,ts,jsx,tsx}',
		'./src/pages/Popup/**/*.{js,ts,jsx,tsx}',
		'./src/pages/Popup/Alerts/**/*.{js,ts,jsx,tsx}',
		'./src/pages/Popup/Main/**/*.{js,ts,jsx,tsx}',
		'./src/pages/Popup/Settings/**/*.{js,ts,jsx,tsx}',
	],

	darkMode: false, // or 'media' or 'class'
	theme: {
		extend: {
			colors: {
				'theme-blue': '#0002FC',
				'theme-orange': '#E17950',
				'theme-orange-dark': '#B86342',
				'theme-yellow': '#FDCE3F',
				'theme-green': '#02C697',
				'theme-purple': '#9923FF',
			},
		},
	},
	variants: {
		extend: {},
	},
	plugins: [require('@tailwindcss/forms'), require('@tailwindcss/line-clamp')],
}
