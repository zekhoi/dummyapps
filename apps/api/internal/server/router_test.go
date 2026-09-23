package server

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

type fakeDB struct{ err error }

func (f fakeDB) Ping(context.Context) error { return f.err }

func do(t *testing.T, r http.Handler, target string, out any) int {
	t.Helper()
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, target, nil))
	if err := json.Unmarshal(w.Body.Bytes(), out); err != nil {
		t.Fatalf("decode %s: %v (body=%q)", target, err, w.Body.String())
	}
	return w.Code
}

func TestHealth(t *testing.T) {
	tests := []struct {
		name     string
		db       Pinger
		wantCode int
		wantDB   string
	}{
		{"disabled", nil, http.StatusOK, "disabled"},
		{"ok", fakeDB{}, http.StatusOK, "ok"},
		{"error", fakeDB{err: errors.New("down")}, http.StatusServiceUnavailable, "error"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var got HealthResponse
			code := do(t, NewRouter(Deps{DB: tt.db}), "/api/health", &got)
			if code != tt.wantCode {
				t.Errorf("status = %d, want %d", code, tt.wantCode)
			}
			if got.Status != "ok" || got.DB != tt.wantDB {
				t.Errorf("body = %+v, want status=ok db=%s", got, tt.wantDB)
			}
		})
	}
}

func TestHello(t *testing.T) {
	tests := []struct {
		query string
		want  string
	}{
		{"", "Hello, world!"},
		{"?name=moon", "Hello, moon!"},
		{"?name=%20%20", "Hello, world!"},
	}

	r := NewRouter(Deps{})
	for _, tt := range tests {
		t.Run(tt.query, func(t *testing.T) {
			var got HelloResponse
			if code := do(t, r, "/api/hello"+tt.query, &got); code != http.StatusOK {
				t.Fatalf("status = %d, want 200", code)
			}
			if got.Message != tt.want {
				t.Errorf("message = %q, want %q", got.Message, tt.want)
			}
		})
	}
}
