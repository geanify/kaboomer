package server

import (
	"encoding/json"
	"kaboomer/internal/manager"
	"kaboomer/internal/youtube"
	"log"
	"net/http"
)

type Server struct {
	manager   *manager.Manager
	yt        *youtube.Service
	staticDir string
}

func New(m *manager.Manager, yt *youtube.Service, staticDir string) *Server {
	return &Server{
		manager:   m,
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
	ID    string `json:"id"`
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

	if req.URL == "" {
		http.Error(w, "URL required", http.StatusBadRequest)
		return
	}

	if req.Title == "" {
		req.Title = "Unknown Track"
	}

	s.manager.Play(req.URL, req.Title, req.ID)
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
		err = s.manager.Pause()
	case "next":
		err = s.manager.Next()
	case "prev":
		err = s.manager.Prev()
	case "seek":
		err = s.manager.Seek(req.Value)
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
		"current_title": s.manager.GetStatus(),
		"position":      0.0,
		"duration":      0.0,
	}

	if pos, err := s.manager.GetProperty("time-pos"); err == nil {
		if posFloat, ok := pos.(float64); ok {
			status["position"] = posFloat
		}
	}
	if dur, err := s.manager.GetProperty("duration"); err == nil {
		if durFloat, ok := dur.(float64); ok {
			status["duration"] = durFloat
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

func (s *Server) handleQueue(w http.ResponseWriter, r *http.Request) {
	queue := s.manager.GetQueue()
	
	// Map to structure frontend expects (PlaylistItem-ish)
	// Frontend expects: filename, title, current?
	// We'll use our queue structure but we need to identify 'current'.
	// We can check title against status.current_title
	currentTitle := s.manager.GetStatus()

	type queueResponseItem struct {
		ID       string `json:"id"`
		Title    string `json:"title"`
		Status   string `json:"status"`
		Current  bool   `json:"current"`
		Filename string `json:"filename"` // Frontend uses this key sometimes
	}
	
	resp := make([]queueResponseItem, len(queue))
	for i, item := range queue {
		resp[i] = queueResponseItem{
			ID:       item.ID,
			Title:    item.Title,
			Status:   string(item.Status),
			Current:  item.Title == currentTitle, // Rough heuristic
			Filename: item.Title, // Fallback
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
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

	s.manager.Add(req.URL, req.Title, req.ID)
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

	if err := s.manager.PlayIndex(req.Index); err != nil {
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
		s.manager.Add(req.URL, req.Title, req.ID)
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

	// Play first
	s.manager.Play(reqs[0].URL, reqs[0].Title, reqs[0].ID)
	
	// Add rest
	for i := 1; i < len(reqs); i++ {
		s.manager.Add(reqs[i].URL, reqs[i].Title, reqs[i].ID)
	}

	w.WriteHeader(http.StatusOK)
}
