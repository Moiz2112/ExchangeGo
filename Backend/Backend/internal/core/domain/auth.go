package domain

// RegisterRequest is the body expected for POST /register
type RegisterRequest struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginRequest is the body expected for POST /login
type LoginRequest struct {
	Username string `json:"username"` // accepts username OR email
	Password string `json:"password"`
}

// AuthResponse is returned on successful register or login
type AuthResponse struct {
	Token    string `json:"token"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

// AuthError is returned when register or login fails
type AuthError struct {
	Message string `json:"error"`
}

// User is the stored user record (never sent to client)
type User struct {
	Email          string
	Username       string
	HashedPassword string
}
