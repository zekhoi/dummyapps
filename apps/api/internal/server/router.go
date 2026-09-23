// Package server wires HTTP routes and middleware.
package server

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Pinger is satisfied by *pgxpool.Pool; nil means the database is disabled.
type Pinger interface {
	Ping(ctx context.Context) error
}

type Deps struct {
	DB          Pinger
	CORSOrigins []string
}

// Response shapes — keep in sync with packages/shared/src/index.ts.
type HealthResponse struct {
	Status string `json:"status"`
	DB     string `json:"db"`
}

type HelloResponse struct {
	Message string `json:"message"`
}

func NewRouter(deps Deps) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	if len(deps.CORSOrigins) > 0 {
		r.Use(cors.New(cors.Config{
			AllowOrigins: deps.CORSOrigins,
			AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions},
			AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
			MaxAge:       12 * time.Hour,
		}))
	}

	api := r.Group("/api")
	api.GET("/health", healthHandler(deps.DB))
	api.GET("/hello", helloHandler)

	return r
}

func healthHandler(db Pinger) gin.HandlerFunc {
	return func(c *gin.Context) {
		if db == nil {
			c.JSON(http.StatusOK, HealthResponse{Status: "ok", DB: "disabled"})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()
		if err := db.Ping(ctx); err != nil {
			c.JSON(http.StatusServiceUnavailable, HealthResponse{Status: "ok", DB: "error"})
			return
		}
		c.JSON(http.StatusOK, HealthResponse{Status: "ok", DB: "ok"})
	}
}

func helloHandler(c *gin.Context) {
	name := strings.TrimSpace(c.Query("name"))
	if name == "" {
		name = "world"
	}
	c.JSON(http.StatusOK, HelloResponse{Message: "Hello, " + name + "!"})
}
