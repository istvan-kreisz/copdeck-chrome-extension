import { string, number, object, optional, Infer, array } from 'superstruct'
import { Currency, Proxy } from 'copdeck-scraper/dist/types'

const Settings = object({
	proxies: array(Proxy),
	currency: Currency,
	updateInterval: number(),
	notificationFrequency: number(),
})

type Settings = Infer<typeof Settings>

export { Settings, Proxy }
