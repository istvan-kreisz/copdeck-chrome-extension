module.exports = {
	purge: ['./src/**/*.html', './src/**/*.js'],
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
	plugins: [],
}
