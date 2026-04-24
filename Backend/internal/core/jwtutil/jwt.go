package jwtutil

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"
)

// Secret used to sign tokens. In production, load this from an environment variable.
var Secret string

func init() {
	Secret = os.Getenv("JWT_SECRET")
	if Secret == "" {
		Secret = "coinstrove-secret-change-in-production"
	}
}

type claims struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Exp      int64  `json:"exp"`
}

// Generate creates a signed JWT token valid for 24 hours.
func Generate(username, email string) (string, error) {
	header := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"HS256","typ":"JWT"}`))

	c := claims{
		Username: username,
		Email:    email,
		Exp:      time.Now().Add(24 * time.Hour).Unix(),
	}
	payloadBytes, err := json.Marshal(c)
	if err != nil {
		return "", err
	}
	payload := base64.RawURLEncoding.EncodeToString(payloadBytes)

	sig := sign(header + "." + payload)
	return header + "." + payload + "." + sig, nil
}

// Validate checks a token and returns the username and email if valid.
func Validate(token string) (username, email string, err error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return "", "", fmt.Errorf("invalid token format")
	}
	expected := sign(parts[0] + "." + parts[1])
	if !hmac.Equal([]byte(parts[2]), []byte(expected)) {
		return "", "", fmt.Errorf("invalid token signature")
	}
	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return "", "", err
	}
	var c claims
	if err = json.Unmarshal(payloadBytes, &c); err != nil {
		return "", "", err
	}
	if time.Now().Unix() > c.Exp {
		return "", "", fmt.Errorf("token expired")
	}
	return c.Username, c.Email, nil
}

func sign(data string) string {
	mac := hmac.New(sha256.New, []byte(Secret))
	mac.Write([]byte(data))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
