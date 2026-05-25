package admin

import (
	"coinstrove/internal/core/domain"
	"coinstrove/internal/core/jwtutil"
	"coinstrove/internal/core/userstore"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

// ReloadHook is called after any exchange or coin change so the price
// service manager can hot-reload without restarting the backend.
var ReloadHook func()

// SetReloadHook lets main.go inject the reload callback.
func SetReloadHook(fn func()) { ReloadHook = fn }

func triggerReload() {
	if ReloadHook != nil {
		go ReloadHook()
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func HandleCORS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.WriteHeader(http.StatusNoContent)
}

// AdminMiddleware validates the admin token from the Authorization header.
// Admin credentials are set via ADMIN_USERNAME / ADMIN_PASSWORD env vars.
func AdminMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			HandleCORS(w, r)
			return
		}
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Missing token"})
			return
		}
		token := strings.TrimPrefix(authHeader, "Bearer ")
		username, _, err := jwtutil.Validate(token)
		if err != nil {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Invalid or expired token"})
			return
		}
		adminUser := os.Getenv("ADMIN_USERNAME")
		if adminUser == "" {
			adminUser = "admin"
		}
		if !strings.EqualFold(username, adminUser) {
			writeJSON(w, http.StatusForbidden, map[string]string{"error": "Admin access required"})
			return
		}
		next(w, r)
	}
}

// ─────────────────────────────────────────────
//  Admin Login  POST /admin/login
// ─────────────────────────────────────────────

func Login(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		return
	}

	adminUser := os.Getenv("ADMIN_USERNAME")
	adminPass := os.Getenv("ADMIN_PASSWORD")
	if adminUser == "" {
		adminUser = "admin"
	}
	if adminPass == "" {
		adminPass = "admin123"
	}

	if !strings.EqualFold(req.Username, adminUser) || req.Password != adminPass {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Invalid admin credentials"})
		return
	}

	token, err := jwtutil.Generate(adminUser, adminUser+"@exchangego.admin")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Token generation failed"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"token": token, "username": adminUser})
}

// ─────────────────────────────────────────────
//  Dashboard  GET /admin/dashboard
// ─────────────────────────────────────────────

func Dashboard(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}

	exchanges, _ := userstore.GlobalStore.GetAllExchanges()
	coins, _ := userstore.GlobalStore.GetAllCoins()
	users, _ := userstore.GlobalStore.GetAllUsers()
	messages, _ := userstore.GlobalStore.GetAllMessages()
	featured, _ := userstore.GlobalStore.GetFeaturedCoins()

	activeEx := 0
	for _, ex := range exchanges {
		if ex.Enabled {
			activeEx++
		}
	}
	unread := 0
	for _, m := range messages {
		if !m.Resolved {
			unread++
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"total_exchanges":  len(exchanges),
		"active_exchanges": activeEx,
		"total_coins":      len(coins),
		"total_users":      len(users),
		"total_messages":   len(messages),
		"unread_messages":  unread,
		"featured_coins":   len(featured),
		"server_time":      time.Now().UTC().Format(time.RFC3339),
	})
}

// ─────────────────────────────────────────────
//  Exchanges
// ─────────────────────────────────────────────

func GetExchanges(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}
	list, err := userstore.GlobalStore.GetAllExchanges()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func UpdateExchange(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}
	idStr := strings.TrimPrefix(r.URL.Path, "/admin/exchanges/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid ID"})
		return
	}

	var ex domain.Exchange2
	if err := json.NewDecoder(r.Body).Decode(&ex); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid body"})
		return
	}
	ex.ID = id
	if err := userstore.GlobalStore.UpdateExchange(ex); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	triggerReload()
	writeJSON(w, http.StatusOK, map[string]string{"message": "Exchange updated"})
}

func DeleteExchange(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}
	idStr := strings.TrimPrefix(r.URL.Path, "/admin/exchanges/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid ID"})
		return
	}
	if err := userstore.GlobalStore.DeleteExchange(id); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	triggerReload()
	writeJSON(w, http.StatusOK, map[string]string{"message": "Exchange deleted"})
}

// ─────────────────────────────────────────────
//  Coins
// ─────────────────────────────────────────────

func GetCoins(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}
	list, err := userstore.GlobalStore.GetAllCoins()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func UpdateCoin(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}
	idStr := strings.TrimPrefix(r.URL.Path, "/admin/coins/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid ID"})
		return
	}
	var c domain.Coin
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid body"})
		return
	}
	c.ID = id
	if err := userstore.GlobalStore.UpdateCoin(c); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	triggerReload()
	writeJSON(w, http.StatusOK, map[string]string{"message": "Coin updated"})
}

func DeleteCoin(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}
	idStr := strings.TrimPrefix(r.URL.Path, "/admin/coins/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid ID"})
		return
	}
	if err := userstore.GlobalStore.DeleteCoin(id); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	triggerReload()
	writeJSON(w, http.StatusOK, map[string]string{"message": "Coin deleted"})
}

// ─────────────────────────────────────────────
//  Users  (read-only list + delete)
// ─────────────────────────────────────────────

func GetUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}
	list, err := userstore.GlobalStore.GetAllUsers()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}
	idStr := strings.TrimPrefix(r.URL.Path, "/admin/users/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid ID"})
		return
	}
	if err := userstore.GlobalStore.DeleteUser(id); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "User deleted"})
}

// ─────────────────────────────────────────────
//  Contact Messages
// ─────────────────────────────────────────────

func GetMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}
	list, err := userstore.GlobalStore.GetAllMessages()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func CreateMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}
	var m domain.ContactMessage
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid body"})
		return
	}
	if err := userstore.GlobalStore.AddMessage(m); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"message": "Message submitted"})
}

func UpdateMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}
	idStr := strings.TrimPrefix(r.URL.Path, "/admin/messages/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid ID"})
		return
	}
	var body struct {
		Resolved bool `json:"resolved"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid body"})
		return
	}
	if err := userstore.GlobalStore.UpdateMessage(id, body.Resolved); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Message updated"})
}

func DeleteMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}
	idStr := strings.TrimPrefix(r.URL.Path, "/admin/messages/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid ID"})
		return
	}
	if err := userstore.GlobalStore.DeleteMessage(id); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Message deleted"})
}

// ─────────────────────────────────────────────
//  Featured Coins
// ─────────────────────────────────────────────

func GetFeatured(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}
	list, err := userstore.GlobalStore.GetFeaturedCoins()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func SetFeatured(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		HandleCORS(w, r)
		return
	}
	var body struct {
		Tickers  []string `json:"tickers"`
		Category string   `json:"category"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid body"})
		return
	}
	if err := userstore.GlobalStore.SetFeaturedCoins(body.Tickers, body.Category); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Featured coins updated"})
}

// ─────────────────────────────────────────────
//
//	Suppress unused import warning
//
// ─────────────────────────────────────────────
var _ = sql.ErrNoRows
var _ = log.Println
