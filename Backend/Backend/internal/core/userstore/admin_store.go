package userstore

import (
	"coinstrove/internal/core/domain"
	"log"
)

// ─────────────────────────────────────────────
//  Schema Migration — call from Init()
// ─────────────────────────────────────────────

// InitAdminTables creates all admin-related tables if they don't exist.
func (s *Store) InitAdminTables() {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS exchanges (
			id           SERIAL PRIMARY KEY,
			name         TEXT UNIQUE NOT NULL,
			slug         TEXT UNIQUE NOT NULL,
			api_endpoint TEXT NOT NULL DEFAULT '',
			enabled      BOOLEAN NOT NULL DEFAULT TRUE,
			created_at   TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS coins (
			id            SERIAL PRIMARY KEY,
			ticker        TEXT UNIQUE NOT NULL,
			name          TEXT NOT NULL,
			emoji         TEXT NOT NULL DEFAULT '',
			color         TEXT NOT NULL DEFAULT '#ffffff',
			display_order INT NOT NULL DEFAULT 0,
			enabled       BOOLEAN NOT NULL DEFAULT TRUE,
			created_at    TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS contact_messages (
			id         SERIAL PRIMARY KEY,
			name       TEXT NOT NULL,
			email      TEXT NOT NULL,
			subject    TEXT NOT NULL DEFAULT '',
			body       TEXT NOT NULL,
			resolved   BOOLEAN NOT NULL DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS featured_coins (
			id       SERIAL PRIMARY KEY,
			ticker   TEXT NOT NULL,
			category TEXT NOT NULL,
			UNIQUE(ticker, category)
		)`,
	}
	for _, q := range queries {
		if _, err := s.db.Exec(q); err != nil {
			log.Printf("InitAdminTables warning: %v", err)
		}
	}

	// Seed default exchanges if table is empty
	var count int
	s.db.QueryRow(`SELECT COUNT(*) FROM exchanges`).Scan(&count)
	if count == 0 {
		defaults := []domain.Exchange2{
			{Name: "Binance", Slug: "binance", APIEndpoint: "https://api.binance.com", Enabled: true},
			{Name: "Kraken", Slug: "kraken", APIEndpoint: "https://api.kraken.com", Enabled: true},
			{Name: "Coinbase", Slug: "coinbase", APIEndpoint: "https://api.coinbase.com", Enabled: true},
			{Name: "OKX", Slug: "okx", APIEndpoint: "https://www.okx.com", Enabled: true},
			{Name: "KuCoin", Slug: "kucoin", APIEndpoint: "https://api.kucoin.com", Enabled: true},
			{Name: "Gate.io", Slug: "gateio", APIEndpoint: "https://data.gateapi.io", Enabled: true},
			{Name: "Bitstamp", Slug: "bitstamp", APIEndpoint: "https://www.bitstamp.net", Enabled: true},
			{Name: "Huobi", Slug: "huobi", APIEndpoint: "https://api.huobi.pro", Enabled: true},
			{Name: "Bitfinex", Slug: "bitfinex", APIEndpoint: "https://api-pub.bitfinex.com", Enabled: true},
		}
		for _, ex := range defaults {
			s.db.Exec(
				`INSERT INTO exchanges (name, slug, api_endpoint, enabled) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
				ex.Name, ex.Slug, ex.APIEndpoint, ex.Enabled,
			)
		}
	}

	// Seed default coins if table is empty
	s.db.QueryRow(`SELECT COUNT(*) FROM coins`).Scan(&count)
	if count == 0 {
		defaults := []domain.Coin{
			{Ticker: "BTC", Name: "Bitcoin", Emoji: "₿", Color: "#f7931a", DisplayOrder: 1, Enabled: true},
			{Ticker: "ETH", Name: "Ethereum", Emoji: "Ξ", Color: "#627eea", DisplayOrder: 2, Enabled: true},
			{Ticker: "ADA", Name: "Cardano", Emoji: "₳", Color: "#3cc8c8", DisplayOrder: 3, Enabled: true},
			{Ticker: "SOL", Name: "Solana", Emoji: "◎", Color: "#9945ff", DisplayOrder: 4, Enabled: true},
			{Ticker: "DOGE", Name: "Dogecoin", Emoji: "Ð", Color: "#c2a633", DisplayOrder: 5, Enabled: true},
			{Ticker: "XRP", Name: "XRP", Emoji: "✕", Color: "#00aae4", DisplayOrder: 6, Enabled: true},
			{Ticker: "DOT", Name: "Polkadot", Emoji: "●", Color: "#e6007a", DisplayOrder: 7, Enabled: true},
			{Ticker: "LTC", Name: "Litecoin", Emoji: "Ł", Color: "#bebebe", DisplayOrder: 8, Enabled: true},
			{Ticker: "BCH", Name: "Bitcoin Cash", Emoji: "₿", Color: "#8dc351", DisplayOrder: 9, Enabled: true},
			{Ticker: "LINK", Name: "Chainlink", Emoji: "⬡", Color: "#2a5ada", DisplayOrder: 10, Enabled: true},
		}
		for _, c := range defaults {
			s.db.Exec(
				`INSERT INTO coins (ticker,name,emoji,color,display_order,enabled) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
				c.Ticker, c.Name, c.Emoji, c.Color, c.DisplayOrder, c.Enabled,
			)
		}
	}

	log.Println("Admin tables ready")
}

// ─────────────────────────────────────────────
//  Exchanges CRUD
// ─────────────────────────────────────────────

func (s *Store) GetAllExchanges() ([]domain.Exchange2, error) {
	rows, err := s.db.Query(`SELECT id, name, slug, api_endpoint, enabled, created_at FROM exchanges ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []domain.Exchange2
	for rows.Next() {
		var ex domain.Exchange2
		rows.Scan(&ex.ID, &ex.Name, &ex.Slug, &ex.APIEndpoint, &ex.Enabled, &ex.CreatedAt)
		list = append(list, ex)
	}
	return list, nil
}

func (s *Store) AddExchange(ex domain.Exchange2) error {
	_, err := s.db.Exec(
		`INSERT INTO exchanges (name, slug, api_endpoint, enabled) VALUES ($1,$2,$3,$4)`,
		ex.Name, ex.Slug, ex.APIEndpoint, ex.Enabled,
	)
	return err
}

func (s *Store) UpdateExchange(ex domain.Exchange2) error {
	_, err := s.db.Exec(
		`UPDATE exchanges SET name=$1, slug=$2, api_endpoint=$3, enabled=$4 WHERE id=$5`,
		ex.Name, ex.Slug, ex.APIEndpoint, ex.Enabled, ex.ID,
	)
	return err
}

func (s *Store) DeleteExchange(id int) error {
	_, err := s.db.Exec(`DELETE FROM exchanges WHERE id=$1`, id)
	return err
}

// ─────────────────────────────────────────────
//  Coins CRUD
// ─────────────────────────────────────────────

func (s *Store) GetAllCoins() ([]domain.Coin, error) {
	rows, err := s.db.Query(`SELECT id, ticker, name, emoji, color, display_order, enabled, created_at FROM coins ORDER BY display_order`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []domain.Coin
	for rows.Next() {
		var c domain.Coin
		rows.Scan(&c.ID, &c.Ticker, &c.Name, &c.Emoji, &c.Color, &c.DisplayOrder, &c.Enabled, &c.CreatedAt)
		list = append(list, c)
	}
	return list, nil
}

func (s *Store) AddCoin(c domain.Coin) error {
	_, err := s.db.Exec(
		`INSERT INTO coins (ticker, name, emoji, color, display_order, enabled) VALUES ($1,$2,$3,$4,$5,$6)`,
		c.Ticker, c.Name, c.Emoji, c.Color, c.DisplayOrder, c.Enabled,
	)
	return err
}

func (s *Store) UpdateCoin(c domain.Coin) error {
	_, err := s.db.Exec(
		`UPDATE coins SET ticker=$1, name=$2, emoji=$3, color=$4, display_order=$5, enabled=$6 WHERE id=$7`,
		c.Ticker, c.Name, c.Emoji, c.Color, c.DisplayOrder, c.Enabled, c.ID,
	)
	return err
}

func (s *Store) DeleteCoin(id int) error {
	_, err := s.db.Exec(`DELETE FROM coins WHERE id=$1`, id)
	return err
}

// ─────────────────────────────────────────────
//  Admin Users
// ─────────────────────────────────────────────

func (s *Store) GetAllUsers() ([]domain.AdminUser, error) {
	rows, err := s.db.Query(`SELECT id, email, username, created_at FROM users ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []domain.AdminUser
	for rows.Next() {
		var u domain.AdminUser
		rows.Scan(&u.ID, &u.Email, &u.Username, &u.CreatedAt)
		list = append(list, u)
	}
	return list, nil
}

func (s *Store) DeleteUser(id int) error {
	_, err := s.db.Exec(`DELETE FROM users WHERE id=$1`, id)
	return err
}

// ─────────────────────────────────────────────
//  Contact Messages CRUD
// ─────────────────────────────────────────────

func (s *Store) GetAllMessages() ([]domain.ContactMessage, error) {
	rows, err := s.db.Query(`SELECT id, name, email, subject, body, resolved, created_at FROM contact_messages ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []domain.ContactMessage
	for rows.Next() {
		var m domain.ContactMessage
		rows.Scan(&m.ID, &m.Name, &m.Email, &m.Subject, &m.Body, &m.Resolved, &m.CreatedAt)
		list = append(list, m)
	}
	return list, nil
}

func (s *Store) AddMessage(m domain.ContactMessage) error {
	_, err := s.db.Exec(
		`INSERT INTO contact_messages (name, email, subject, body) VALUES ($1,$2,$3,$4)`,
		m.Name, m.Email, m.Subject, m.Body,
	)
	return err
}

func (s *Store) UpdateMessage(id int, resolved bool) error {
	_, err := s.db.Exec(`UPDATE contact_messages SET resolved=$1 WHERE id=$2`, resolved, id)
	return err
}

func (s *Store) DeleteMessage(id int) error {
	_, err := s.db.Exec(`DELETE FROM contact_messages WHERE id=$1`, id)
	return err
}

// ─────────────────────────────────────────────
//  Featured Coins
// ─────────────────────────────────────────────

func (s *Store) GetFeaturedCoins() ([]domain.FeaturedCoin, error) {
	rows, err := s.db.Query(`SELECT id, ticker, category FROM featured_coins ORDER BY category, ticker`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []domain.FeaturedCoin
	for rows.Next() {
		var f domain.FeaturedCoin
		rows.Scan(&f.ID, &f.Ticker, &f.Category)
		list = append(list, f)
	}
	return list, nil
}

func (s *Store) SetFeaturedCoins(tickers []string, category string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	// Remove all existing entries for this category
	if _, err := tx.Exec(`DELETE FROM featured_coins WHERE category=$1`, category); err != nil {
		tx.Rollback()
		return err
	}
	// Insert new entries
	for _, ticker := range tickers {
		if _, err := tx.Exec(
			`INSERT INTO featured_coins (ticker, category) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
			ticker, category,
		); err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}
