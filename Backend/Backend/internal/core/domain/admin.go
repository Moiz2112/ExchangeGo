package domain

import "time"

// Exchange2 represents a managed exchange entry in the admin panel.
// Named Exchange2 to avoid collision with the existing Exchange struct.
type Exchange2 struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Slug        string    `json:"slug"`
	APIEndpoint string    `json:"api_endpoint"`
	Enabled     bool      `json:"enabled"`
	CreatedAt   time.Time `json:"created_at"`
}

// Coin represents a managed cryptocurrency in the admin panel.
type Coin struct {
	ID           int       `json:"id"`
	Ticker       string    `json:"ticker"`
	Name         string    `json:"name"`
	Emoji        string    `json:"emoji"`
	Color        string    `json:"color"`
	DisplayOrder int       `json:"display_order"`
	Enabled      bool      `json:"enabled"`
	CreatedAt    time.Time `json:"created_at"`
}

// AdminUser is a safe (no-password) view of a user for the admin panel.
type AdminUser struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	Username  string    `json:"username"`
	CreatedAt time.Time `json:"created_at"`
}

// ContactMessage represents a user-submitted feedback/contact message.
type ContactMessage struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Subject   string    `json:"subject"`
	Body      string    `json:"body"`
	Resolved  bool      `json:"resolved"`
	CreatedAt time.Time `json:"created_at"`
}

// FeaturedCoin represents a coin selected to appear in a featured section.
type FeaturedCoin struct {
	ID       int    `json:"id"`
	Ticker   string `json:"ticker"`
	Category string `json:"category"` // e.g. "trending", "top_volume", "recommended"
}
