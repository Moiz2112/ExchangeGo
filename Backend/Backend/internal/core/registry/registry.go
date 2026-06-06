// Package registry holds a live in-memory cache of which exchanges and coins
// are currently enabled by the admin. Every price service calls IsExchangeEnabled()
// before hitting an external API. The admin handler calls Refresh() after any
// exchange or coin update so changes take effect on the next price tick (~7 s).
package registry

import (
	"coinstrove/internal/core/userstore"
	"log"
	"strings"
	"sync"
)

type ConfigRegistry struct {
	mu               sync.RWMutex
	enabledExchanges map[string]bool // slug → enabled
	enabledCoins     map[string]bool // ticker (upper) → enabled
}

var Global = &ConfigRegistry{
	enabledExchanges: make(map[string]bool),
	enabledCoins:     make(map[string]bool),
}

// Refresh reloads exchange + coin state from the database.
// Called once at startup and after every admin save.
func (r *ConfigRegistry) Refresh() {
	exchanges, err := userstore.GlobalStore.GetAllExchanges()
	if err != nil {
		log.Printf("registry: failed to load exchanges: %v", err)
		return
	}
	coins, err := userstore.GlobalStore.GetAllCoins()
	if err != nil {
		log.Printf("registry: failed to load coins: %v", err)
		return
	}

	newEx := make(map[string]bool, len(exchanges))
	for _, ex := range exchanges {
		newEx[strings.ToLower(ex.Slug)] = ex.Enabled
	}

	newCoins := make(map[string]bool, len(coins))
	for _, c := range coins {
		newCoins[strings.ToUpper(c.Ticker)] = c.Enabled
	}

	r.mu.Lock()
	r.enabledExchanges = newEx
	r.enabledCoins = newCoins
	r.mu.Unlock()

	log.Printf("registry: refreshed — %d exchanges, %d coins", len(newEx), len(newCoins))
}

// IsExchangeEnabled returns true if the exchange slug is enabled (or unknown — fail open).
func (r *ConfigRegistry) IsExchangeEnabled(slug string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	enabled, ok := r.enabledExchanges[strings.ToLower(slug)]
	if !ok {
		return true // unknown → allow (fail open until first DB load)
	}
	return enabled
}

// IsCoinEnabled returns true if the ticker is enabled.
func (r *ConfigRegistry) IsCoinEnabled(ticker string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	enabled, ok := r.enabledCoins[strings.ToUpper(ticker)]
	if !ok {
		return true // unknown → allow
	}
	return enabled
}

// EnabledCoins returns a copy of all enabled ticker symbols.
func (r *ConfigRegistry) EnabledCoins() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]string, 0, len(r.enabledCoins))
	for ticker, enabled := range r.enabledCoins {
		if enabled {
			out = append(out, ticker)
		}
	}
	return out
}

// EnabledExchangeSlugs returns slugs of all enabled exchanges.
func (r *ConfigRegistry) EnabledExchangeSlugs() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]string, 0, len(r.enabledExchanges))
	for slug, enabled := range r.enabledExchanges {
		if enabled {
			out = append(out, slug)
		}
	}
	return out
}
