package admin

import "net/http"

// RegisterRoutes wires up all /admin/* endpoints.
// Protected routes are wrapped with AdminMiddleware.
func RegisterRoutes() {
	// Public config endpoint — frontend polls this for enabled coins/exchanges
	http.HandleFunc("/config", GetPublicConfig)
	// Admin auth (public)
	http.HandleFunc("/admin/login", Login)

	// Dashboard
	http.HandleFunc("/admin/dashboard", AdminMiddleware(Dashboard))

	// Exchanges — list, edit & delete only (no add)
	http.HandleFunc("/admin/exchanges", AdminMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			GetExchanges(w, r)
		} else {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		}
	}))
	http.HandleFunc("/admin/exchanges/", AdminMiddleware(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut:
			UpdateExchange(w, r)
		case http.MethodDelete:
			DeleteExchange(w, r)
		default:
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		}
	}))

	// Coins — list, edit & delete only (no add)
	http.HandleFunc("/admin/coins", AdminMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			GetCoins(w, r)
		} else {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		}
	}))
	http.HandleFunc("/admin/coins/", AdminMiddleware(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut:
			UpdateCoin(w, r)
		case http.MethodDelete:
			DeleteCoin(w, r)
		default:
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		}
	}))

	// Users
	http.HandleFunc("/admin/users", AdminMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			GetUsers(w, r)
		} else {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		}
	}))
	http.HandleFunc("/admin/users/", AdminMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			DeleteUser(w, r)
		} else {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		}
	}))

	// Messages (public POST so users can submit; admin GET/PUT/DELETE protected)
	http.HandleFunc("/contact", CreateMessage)
	http.HandleFunc("/admin/messages", AdminMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			GetMessages(w, r)
		} else {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		}
	}))
	http.HandleFunc("/admin/messages/", AdminMiddleware(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut:
			UpdateMessage(w, r)
		case http.MethodDelete:
			DeleteMessage(w, r)
		default:
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		}
	}))

	// Featured Coins (public GET so frontend can read; admin POST protected)
	http.HandleFunc("/featured", GetFeatured)
	http.HandleFunc("/admin/featured", AdminMiddleware(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			GetFeatured(w, r)
		case http.MethodPost:
			SetFeatured(w, r)
		default:
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		}
	}))
}
