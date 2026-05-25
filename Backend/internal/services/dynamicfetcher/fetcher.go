// Package dynamicfetcher provides a universal price fetcher that reads the
// enabled coins list from the registry at runtime, so adding/removing coins
// in the admin portal immediately affects which prices are fetched.
//
// Each exchange has a URL template and a response parser.
// New exchanges added via admin use Binance as a fallback (most coins available).
package dynamicfetcher

import (
	"coinstrove/internal/core/domain"
	"coinstrove/internal/core/ports"
	"coinstrove/internal/core/publisher"
	"coinstrove/internal/core/registry"
	"coinstrove/internal/core/userstore"
	"coinstrove/pkg/http"
	"fmt"
	"log"
	"strconv"
	"strings"
	"sync"
)

// ─── URL builders ────────────────────────────────────────────────────────────
// Each function takes a ticker and returns the API URL for that coin.

type urlBuilder func(ticker string) string
type parser func(resp interface{}) string

type exchangeDef struct {
	name    string
	slug    string
	builder urlBuilder
	parser  parser
}

var client = http.NewHttpClientWithTimeout(3)

// ─── Exchange definitions ─────────────────────────────────────────────────────

var knownExchanges = map[string]exchangeDef{
	"binance": {
		name: "Binance",
		slug: "binance",
		builder: func(t string) string {
			return fmt.Sprintf("https://api.binance.com/api/v3/ticker/price?symbol=%sUSDT", strings.ToUpper(t))
		},
		parser: parseBinance,
	},
	"kraken": {
		name: "Kraken",
		slug: "kraken",
		builder: func(t string) string {
			return fmt.Sprintf("https://api.kraken.com/0/public/Ticker?pair=%sUSDT", strings.ToUpper(t))
		},
		parser: parseKraken,
	},
	"coinbase": {
		name: "Coinbase",
		slug: "coinbase",
		builder: func(t string) string {
			return fmt.Sprintf("https://api.coinbase.com/v2/prices/%s-USD/buy", strings.ToUpper(t))
		},
		parser: parseCoinbase,
	},
	"okx": {
		name: "Okx",
		slug: "okx",
		builder: func(t string) string {
			return fmt.Sprintf("https://www.okx.com/api/v5/market/ticker?instId=%s-USDT", strings.ToUpper(t))
		},
		parser: parseOkx,
	},
	"kucoin": {
		name: "Kucoin",
		slug: "kucoin",
		builder: func(t string) string {
			return fmt.Sprintf("https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=%s-USDT", strings.ToUpper(t))
		},
		parser: parseKucoin,
	},
	"gateio": {
		name: "Gate.io",
		slug: "gateio",
		builder: func(t string) string {
			return fmt.Sprintf("https://data.gateapi.io/api2/1/ticker/%s_usdt", strings.ToLower(t))
		},
		parser: parseGateio,
	},
	"bitstamp": {
		name: "Bitstamp",
		slug: "bitstamp",
		builder: func(t string) string {
			return fmt.Sprintf("https://www.bitstamp.net/api/v2/ticker/%susd/", strings.ToLower(t))
		},
		parser: parseBitstamp,
	},
	"huobi": {
		name: "Huobi",
		slug: "huobi",
		builder: func(t string) string {
			return fmt.Sprintf("https://api.huobi.pro/market/trade?symbol=%susdt", strings.ToLower(t))
		},
		parser: parseHuobi,
	},
	"bitfinex": {
		name: "Bitfinex",
		slug: "bitfinex",
		builder: func(t string) string {
			return fmt.Sprintf("https://api-pub.bitfinex.com/v2/ticker/t%sUSD", strings.ToUpper(t))
		},
		parser: parseBitfinex,
	},
}

// ─── Dynamic service ─────────────────────────────────────────────────────────

type DynamicService struct {
	slug      string
	broadcast ports.BroadCastHandler
	pub       ports.Publisher
}

func NewDynamicService(slug string, broadcast ports.BroadCastHandler, pub ports.Publisher) ports.PriceService {
	return &DynamicService{slug: strings.ToLower(slug), broadcast: broadcast, pub: pub}
}

func (d *DynamicService) GetThePrice() {
	slug := d.slug

	if !registry.Global.IsExchangeEnabled(slug) {
		return
	}

	def, known := knownExchanges[slug]
	if !known {
		// Unknown exchange added via admin — use Binance URL pattern as best-effort fallback
		def = exchangeDef{
			name: slug,
			slug: slug,
			builder: func(t string) string {
				return fmt.Sprintf("https://api.binance.com/api/v3/ticker/price?symbol=%sUSDT", strings.ToUpper(t))
			},
			parser: parseBinance,
		}
		log.Printf("dynamic: unknown exchange %q — using Binance URL pattern as fallback", slug)
	}

	coins := registry.Global.EnabledCoins()
	if len(coins) == 0 {
		return
	}

	var mu sync.Mutex
	var wg sync.WaitGroup
	var currencies []domain.Currency

	for _, ticker := range coins {
		wg.Add(1)
		go func(t string) {
			defer wg.Done()
			url := def.builder(t)
			resp, err := client.Get(url)
			if err != nil {
				return
			}
			priceStr := def.parser(resp)
			if priceStr == "" {
				return
			}
			price, err := strconv.ParseFloat(priceStr, 64)
			if err != nil || price <= 0 {
				return
			}
			mu.Lock()
			currencies = append(currencies, domain.Currency{Name: t, Price: priceStr})
			userstore.GlobalStore.SavePrice(def.name, t, price)
			mu.Unlock()
		}(ticker)
	}
	wg.Wait()

	if len(currencies) == 0 {
		return
	}

	response := domain.Response{}
	response.Data.ExchangeName = def.name
	response.Data.Currencies = currencies

	d.broadcast.BroadCast(response)
	if d.pub != nil {
		d.pub.Publish(response)
	}
}

func (d *DynamicService) BroadCast()  {}
func (d *DynamicService) WriteToQue() {}

// ─── Parsers ─────────────────────────────────────────────────────────────────

func parseBinance(resp interface{}) string {
	m, ok := resp.(map[string]interface{})
	if !ok {
		return ""
	}
	v, _ := m["price"].(string)
	return v
}

func parseKraken(resp interface{}) string {
	m, ok := resp.(map[string]interface{})
	if !ok {
		return ""
	}
	result, ok := m["result"].(map[string]interface{})
	if !ok {
		return ""
	}
	for _, v := range result { // iterate — key varies per pair
		pair, ok := v.(map[string]interface{})
		if !ok {
			continue
		}
		a, ok := pair["a"].([]interface{})
		if !ok || len(a) == 0 {
			continue
		}
		price, _ := a[0].(string)
		return price
	}
	return ""
}

func parseCoinbase(resp interface{}) string {
	m, ok := resp.(map[string]interface{})
	if !ok {
		return ""
	}
	data, ok := m["data"].(map[string]interface{})
	if !ok {
		return ""
	}
	amount, _ := data["amount"].(string)
	return amount
}

func parseOkx(resp interface{}) string {
	m, ok := resp.(map[string]interface{})
	if !ok {
		return ""
	}
	data, ok := m["data"].([]interface{})
	if !ok || len(data) == 0 {
		return ""
	}
	item, ok := data[0].(map[string]interface{})
	if !ok {
		return ""
	}
	price, _ := item["last"].(string)
	return price
}

func parseKucoin(resp interface{}) string {
	m, ok := resp.(map[string]interface{})
	if !ok {
		return ""
	}
	data, ok := m["data"].(map[string]interface{})
	if !ok {
		return ""
	}
	price, _ := data["price"].(string)
	return price
}

func parseGateio(resp interface{}) string {
	m, ok := resp.(map[string]interface{})
	if !ok {
		return ""
	}
	price, _ := m["last"].(string)
	return price
}

func parseBitstamp(resp interface{}) string {
	m, ok := resp.(map[string]interface{})
	if !ok {
		return ""
	}
	price, _ := m["ask"].(string)
	return price
}

func parseHuobi(resp interface{}) string {
	m, ok := resp.(map[string]interface{})
	if !ok {
		return ""
	}
	tick, ok := m["tick"].(map[string]interface{})
	if !ok {
		return ""
	}
	data, ok := tick["data"].([]interface{})
	if !ok || len(data) == 0 {
		return ""
	}
	first, ok := data[0].(map[string]interface{})
	if !ok {
		return ""
	}
	price, _ := first["price"].(float64)
	if price == 0 {
		return ""
	}
	return fmt.Sprintf("%f", price)
}

func parseBitfinex(resp interface{}) string {
	arr, ok := resp.([]interface{})
	if !ok || len(arr) < 3 {
		return ""
	}
	price, _ := arr[2].(float64)
	if price == 0 {
		return ""
	}
	return fmt.Sprintf("%g", price)
}

// ─── Factory: build service list from DB at startup (and after admin changes) ─

// BuildServicesFromRegistry reads enabled exchanges from the registry and
// returns a PriceService for each. Call this at startup and whenever the
// admin enables/disables an exchange. The returned slice replaces the old
// hardcoded priceService slice in main.go.
func BuildServicesFromRegistry(broadcast ports.BroadCastHandler, pub ports.Publisher) []ports.PriceService {
	slugs := registry.Global.EnabledExchangeSlugs()
	services := make([]ports.PriceService, 0, len(slugs))
	for _, slug := range slugs {
		services = append(services, NewDynamicService(slug, broadcast, pub))
	}
	log.Printf("dynamic: built %d price services: %v", len(services), slugs)
	return services
}

// Ensure publisher nil-safety (publisher may be nil if RabbitMQ is down)
var _ = publisher.NewRabbitMQPublisher
