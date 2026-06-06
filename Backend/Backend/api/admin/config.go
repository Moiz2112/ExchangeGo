package admin

import (
	"coinstrove/internal/core/registry"
	"coinstrove/internal/core/userstore"
	"net/http"
)

// GetPublicConfig is a public (no-auth) endpoint the frontend polls to know
// which coins and exchanges are currently enabled. Returns:
//
//	{
//	  "enabled_coins":     ["BTC","ETH",...],
//	  "enabled_exchanges": ["binance","kraken",...],
//	  "coins_meta":        [{id,ticker,name,emoji,color,display_order},...],
//	  "featured":          [{ticker,category},...],
//	}
func GetPublicConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}

	coins, _ := userstore.GlobalStore.GetAllCoins()
	featured, _ := userstore.GlobalStore.GetFeaturedCoins()

	type CoinMeta struct {
		Ticker       string `json:"ticker"`
		Name         string `json:"name"`
		Emoji        string `json:"emoji"`
		Color        string `json:"color"`
		DisplayOrder int    `json:"display_order"`
		Enabled      bool   `json:"enabled"`
	}

	var coinsMeta []CoinMeta
	for _, c := range coins {
		coinsMeta = append(coinsMeta, CoinMeta{
			Ticker:       c.Ticker,
			Name:         c.Name,
			Emoji:        c.Emoji,
			Color:        c.Color,
			DisplayOrder: c.DisplayOrder,
			Enabled:      c.Enabled,
		})
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"enabled_coins":     registry.Global.EnabledCoins(),
		"enabled_exchanges": registry.Global.EnabledExchangeSlugs(),
		"coins_meta":        coinsMeta,
		"featured":          featured,
	})
}
