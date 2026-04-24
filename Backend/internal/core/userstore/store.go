package userstore

import (
	"coinstrove/internal/core/domain"
	"database/sql"
	"log"
	"os"
	"strings"

	_ "github.com/lib/pq"
)

type Store struct {
	db *sql.DB
}

var GlobalStore *Store

// Init connects to Postgres and creates the users table if it doesn't exist.
func Init() {
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		dbURL = "postgres://coinstrove:coinstrove123@localhost:5433/coinstrove?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	if err = db.Ping(); err != nil {
		log.Fatalf("Database not reachable: %v", err)
	}

	// Create users table if it doesn't exist
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id       SERIAL PRIMARY KEY,
			email    TEXT UNIQUE NOT NULL,
			username TEXT UNIQUE NOT NULL,
			password TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT NOW()
		)
	`)
	if err != nil {
		log.Fatalf("Failed to create users table: %v", err)
	}
	_, err = db.Exec(`
    CREATE TABLE IF NOT EXISTS price_history (
        id          SERIAL PRIMARY KEY,
        exchange    TEXT NOT NULL,
        coin        TEXT NOT NULL,
        price       NUMERIC(18,8) NOT NULL,
        recorded_at TIMESTAMP DEFAULT NOW()
    )
  `)
    if err != nil {
       log.Fatalf("Failed to create price_history table: %v", err)
   }

	GlobalStore = &Store{db: db}
	log.Println("Database connected, users table and price_history table ready")
}

func (s *Store) Add(user domain.User) bool {
	_, err := s.db.Exec(
		`INSERT INTO users (email, username, password) VALUES ($1, $2, $3)`,
		strings.ToLower(user.Email), user.Username, user.HashedPassword,
	)
	return err == nil
}

func (s *Store) FindByUsernameOrEmail(identifier string) *domain.User {
	row := s.db.QueryRow(
		`SELECT email, username, password FROM users 
		 WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1) LIMIT 1`,
		identifier,
	)
	var u domain.User
	if err := row.Scan(&u.Email, &u.Username, &u.HashedPassword); err != nil {
		return nil
	}
	return &u
}

func (s *Store) EmailExists(email string) bool {
	var count int
	s.db.QueryRow(`SELECT COUNT(*) FROM users WHERE LOWER(email) = LOWER($1)`, email).Scan(&count)
	return count > 0
}

func (s *Store) UsernameExists(username string) bool {
	var count int
	s.db.QueryRow(`SELECT COUNT(*) FROM users WHERE LOWER(username) = LOWER($1)`, username).Scan(&count)
	return count > 0
}

// SavePrice stores a real-time price snapshot into the database
func (s *Store) SavePrice(exchange, coin string, price float64) {
	s.db.Exec(
		`INSERT INTO price_history (exchange, coin, price) VALUES ($1, $2, $3)`,
		strings.ToLower(exchange), strings.ToUpper(coin), price,
	)
}

// GetLatestPrices returns the most recent price for every exchange+coin pair
func (s *Store) GetLatestPrices() map[string]map[string]float64 {
	rows, err := s.db.Query(`
		SELECT DISTINCT ON (exchange, coin) exchange, coin, price
		FROM price_history
		WHERE recorded_at >= NOW() - INTERVAL '7 days'
		ORDER BY exchange, coin, recorded_at DESC
	`)
	if err != nil {
		return nil
	}
	defer rows.Close()

	result := make(map[string]map[string]float64)
	for rows.Next() {
		var exchange, coin string
		var price float64
		rows.Scan(&exchange, &coin, &price)
		if result[exchange] == nil {
			result[exchange] = make(map[string]float64)
		}
		result[exchange][coin] = price
	}
	return result
}
