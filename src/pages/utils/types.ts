import { string, number, object, optional, Infer, array } from 'superstruct'
import { Currency } from 'copdeck-scraper/dist/types'

const Proxy = object({
	host: string(),
	port: number(),
	protocol: string(),
	auth: optional(
		object({
			username: string(),
			password: string(),
		})
	),
})

type Proxy = Infer<typeof Proxy>

const Settings = object({
	proxies: array(Proxy),
	currency: Currency,
	updateInterval: number(),
	notificationFrequency: number(),
})

type Settings = Infer<typeof Settings>

export { Settings, Proxy }
