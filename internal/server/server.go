package server

import (
	"encoding/json"
	"kaboomer/internal/player"
	"kaboomer/internal/youtube"
	"log"
	"net/http"
)

type Server struct {
	player    *player.Player
	yt        *youtube.Service
	staticDir string
}

func New(p *player.Player, yt *youtube.Service, staticDir string) *Server {
	return &Server{
		player:    p,
		yt:        yt,
		staticDir: staticDir,
	}
}

func (s *Server) Start(port string) error {
	mux := http.NewServeMux()

	// Static files
	fs := http.FileServer(http.Dir(s.staticDir))
	mux.Handle("/", fs)

	// API Endpoints
	mux.HandleFunc("/api/search", s.handleSearch)
	mux.HandleFunc("/api/play", s.handlePlay)
	mux.HandleFunc("/api/control", s.handleControl)
	mux.HandleFunc("/api/status", s.handleStatus)
	mux.HandleFunc("/api/queue", s.handleQueue)
	mux.HandleFunc("/api/queue/add", s.handleQueueAdd)
	mux.HandleFunc("/api/queue/play", s.handleQueuePlay)
	mux.HandleFunc("/api/queue/add_batch", s.handleQueueAddBatch)
	mux.HandleFunc("/api/play_batch", s.handlePlayBatch)

	log.Printf("Server listening on %s", port)
	return http.ListenAndServe(port, mux)
}

func (s *Server) handleSearch(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Missing query", http.StatusBadRequest)
		return
	}

	results, err := s.yt.Search(query)
	if err != nil {
		log.Printf("Search error: %v", err)
		http.Error(w, "Search failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

type PlayRequest struct {
	URL   string `json:"url"`
	Title string `json:"title"`
}

func (s *Server) handlePlay(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req PlayRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	// If no URL but we have a Title (maybe direct search result?), assumes URL is passed
	if req.URL == "" {
		http.Error(w, "URL required", http.StatusBadRequest)
		return
	}

	if req.Title == "" {
		req.Title = "Unknown Track"
	}

	err := s.player.Play(req.URL, req.Title)
	if err != nil {
		log.Printf("Play error: %v", err)
		http.Error(w, "Failed to play", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

type ControlRequest struct {
	Action string  `json:"action"` // pause, resume, next, prev, seek
	Value  float64 `json:"value,omitempty"`
}

func (s *Server) handleControl(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ControlRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	var err error
	switch req.Action {
	case "pause", "resume": // toggle
		err = s.player.Pause()
	case "next":
		err = s.player.Next()
	case "prev":
		err = s.player.Prev()
	case "seek":
		err = s.player.Seek(req.Value)
	default:
		http.Error(w, "Unknown action", http.StatusBadRequest)
		return
	}

	if err != nil {
		log.Printf("Control error: %v", err)
		http.Error(w, "Action failed", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleStatus(w http.ResponseWriter, r *http.Request) {
	status := map[string]interface{}{
		"current_title": s.player.GetStatus(),
		"position":      0.0,
		"duration":      0.0,
	}

	// Get progress info
	if pos, err := s.player.GetProperty("time-pos"); err == nil {
		if posFloat, ok := pos.(float64); ok {
			status["position"] = posFloat
		}
	} else if err.Error() != "mpv error: property unavailable" {
		log.Printf("Failed to get time-pos: %v", err)
	}

	if dur, err := s.player.GetProperty("duration"); err == nil {
		if durFloat, ok := dur.(float64); ok {
			status["duration"] = durFloat
		}
	} else if err.Error() != "mpv error: property unavailable" {
		log.Printf("Failed to get duration: %v", err)
	}

	// Try to get real playlist info to see what's playing
	playlist, err := s.player.GetPlaylist()
	if err == nil {
		for _, item := range playlist {
			if current, ok := item["current"].(bool); ok && current {
				if title, ok := item["title"].(string); ok {
					status["current_title"] = title
				} else if filename, ok := item["filename"].(string); ok {
					status["current_title"] = filename
				}
				break
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

func (s *Server) handleQueue(w http.ResponseWriter, r *http.Request) {
	playlist, err := s.player.GetPlaylist()
	if err != nil {
		log.Printf("Queue error: %v", err)
		http.Error(w, "Failed to get queue", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(playlist)
}

func (s *Server) handleQueueAdd(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req PlayRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	if req.URL == "" {
		http.Error(w, "URL required", http.StatusBadRequest)
		return
	}

	if req.Title == "" {
		req.Title = "Unknown Track"
	}

	// err := s.player.Append(req.URL, req.Title)
	w.WriteHeader(http.StatusOK)
}

type QueuePlayRequest struct {
	Index int `json:"index"`
}

func (s *Server) handleQueuePlay(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req QueuePlayRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	if err := s.player.PlayIndex(req.Index); err != nil {
		log.Printf("Queue Play error: %v", err)
		http.Error(w, "Failed to play queue item", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleQueueAddBatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var reqs []PlayRequest
	if err := json.NewDecoder(r.Body).Decode(&reqs); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	for _, req := range reqs {
		if req.URL == "" {
			continue
		}
		if req.Title == "" {
			req.Title = "Unknown Track"
		}
		// We ignore errors for individual items to keep going
		s.player.Append(req.URL, req.Title)
	}

	w.WriteHeader(http.StatusOK)
}

func (s *Server) handlePlayBatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var reqs []PlayRequest
	if err := json.NewDecoder(r.Body).Decode(&reqs); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	if len(reqs) == 0 {
		return
	}

	// Play first item (replace)
	first := reqs[0]
	if first.Title == "" {
		first.Title = "Unknown Track"
	}
	if err := s.player.Play(first.URL, first.Title); err != nil {
		log.Printf("Play Batch error (first): %v", err)
		http.Error(w, "Failed to play first item", http.StatusInternalServerError)
		return
	}

	// Append rest
	for i := 1; i < len(reqs); i++ {
		req := reqs[i]
		if req.URL == "" {
			continue
		}
		if req.Title == "" {
			req.Title = "Unknown Track"
		}
		s.player.Append(req.URL, req.Title)
	}

	w.WriteHeader(http.StatusOK)
}
