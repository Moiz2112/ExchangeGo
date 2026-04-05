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

	GlobalStore = &Store{db: db}
	log.Println("Database connected and users table ready")
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
