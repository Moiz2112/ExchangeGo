package auth

import (
	"coinstrove/internal/core/domain"
	"coinstrove/internal/core/jwtutil"
	"coinstrove/internal/core/userstore"
	"encoding/json"
	"net/http"
	"regexp"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

var emailRegex = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

// writeJSON writes a JSON response with the given status code.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*") // allow frontend on different port
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

// HandleCORS handles preflight OPTIONS requests from the browser.
func HandleCORS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.WriteHeader(http.StatusNoContent)
}

// Register handles POST /register
// Body: { "email": "...", "username": "...", "password": "..." }
func Register(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, domain.AuthError{Message: "Method not allowed"})
		return
	}

	var req domain.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, domain.AuthError{Message: "Invalid request body"})
		return
	}

	// Validate fields
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Username = strings.TrimSpace(req.Username)
	req.Password = strings.TrimSpace(req.Password)

	if req.Email == "" || req.Username == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, domain.AuthError{Message: "Email, username and password are required"})
		return
	}
	if !emailRegex.MatchString(req.Email) {
		writeJSON(w, http.StatusBadRequest, domain.AuthError{Message: "Invalid email address"})
		return
	}
	if len(req.Username) < 3 {
		writeJSON(w, http.StatusBadRequest, domain.AuthError{Message: "Username must be at least 3 characters"})
		return
	}
	if len(req.Password) < 6 {
		writeJSON(w, http.StatusBadRequest, domain.AuthError{Message: "Password must be at least 6 characters"})
		return
	}
	if userstore.GlobalStore.EmailExists(req.Email) {
		writeJSON(w, http.StatusConflict, domain.AuthError{Message: "An account with this email already exists"})
		return
	}
	if userstore.GlobalStore.UsernameExists(req.Username) {
		writeJSON(w, http.StatusConflict, domain.AuthError{Message: "This username is already taken"})
		return
	}

	// Hash password with bcrypt
	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, domain.AuthError{Message: "Failed to process password"})
		return
	}

	userstore.GlobalStore.Add(domain.User{
		Email:          req.Email,
		Username:       req.Username,
		HashedPassword: string(hashed),
	})

	token, err := jwtutil.Generate(req.Username, req.Email)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, domain.AuthError{Message: "Failed to generate token"})
		return
	}

	writeJSON(w, http.StatusCreated, domain.AuthResponse{
		Token:    token,
		Username: req.Username,
		Email:    req.Email,
	})
}

// Login handles POST /login
// Body: { "username": "...", "password": "..." }  (username can be email too)
func Login(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, domain.AuthError{Message: "Method not allowed"})
		return
	}

	var req domain.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, domain.AuthError{Message: "Invalid request body"})
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	req.Password = strings.TrimSpace(req.Password)

	if req.Username == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, domain.AuthError{Message: "Username and password are required"})
		return
	}

	user := userstore.GlobalStore.FindByUsernameOrEmail(req.Username)
	if user == nil {
		// Generic message — don't reveal whether username or password was wrong
		writeJSON(w, http.StatusUnauthorized, domain.AuthError{Message: "Incorrect username or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.HashedPassword), []byte(req.Password)); err != nil {
		writeJSON(w, http.StatusUnauthorized, domain.AuthError{Message: "Incorrect username or password"})
		return
	}

	token, err := jwtutil.Generate(user.Username, user.Email)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, domain.AuthError{Message: "Failed to generate token"})
		return
	}

	writeJSON(w, http.StatusOK, domain.AuthResponse{
		Token:    token,
		Username: user.Username,
		Email:    user.Email,
	})
}
