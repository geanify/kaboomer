package manager

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"kaboomer/internal/downloader"
	"kaboomer/internal/player"
	"kaboomer/internal/youtube"
	"log"
	"sync"
)

type TrackStatus string

const (
	StatusPending     TrackStatus = "pending"
	StatusDownloading TrackStatus = "downloading"
	StatusReady       TrackStatus = "ready"
	StatusPlaying     TrackStatus = "playing"
	StatusPlayed      TrackStatus = "played"
	StatusError       TrackStatus = "error"
)

type QueueItem struct {
	ID        string      `json:"id"`
	URL       string      `json:"url"`
	Title     string      `json:"title"`
	Status    TrackStatus `json:"status"`
	LocalPath string      `json:"-"`
	Error     string      `json:"error,omitempty"`
}

type Manager struct {
	player     *player.Player
	downloader *downloader.Downloader
	yt         *youtube.Service // Helper for ID extraction if needed
	queue      []*QueueItem
	mu         sync.Mutex

	downloadChan chan *QueueItem
	playTarget   *QueueItem // If set, play this immediately when ready
}

func New(p *player.Player, d *downloader.Downloader, yt *youtube.Service) *Manager {
	m := &Manager{
		player:       p,
		downloader:   d,
		yt:           yt,
		queue:        make([]*QueueItem, 0),
		downloadChan: make(chan *QueueItem, 100), // Buffer
	}

	// Start background workers
	go m.downloadWorker()

	return m
}

func (m *Manager) downloadWorker() {
	for item := range m.downloadChan {
		m.processItem(item)
	}
}

func (m *Manager) processItem(item *QueueItem) {
	// Double check status
	m.mu.Lock()
	if item.Status != StatusPending {
		m.mu.Unlock()
		return
	}
	item.Status = StatusDownloading
	m.mu.Unlock()

	// Download
	path, err := m.downloader.Download(item.URL, item.ID)

	m.mu.Lock()
	defer m.mu.Unlock()

	if err != nil {
		log.Printf("Error downloading %s: %v", item.Title, err)
		item.Status = StatusError
		item.Error = err.Error()

		if m.playTarget == item {
			m.playNextAvailable(item)
		}
		return
	}

	item.LocalPath = path
	item.Status = StatusReady

	// Logic to play or append
	if m.playTarget == item {
		// This was requested to play immediately
		log.Printf("PlayTarget ready: %s", item.Title)
		if err := m.player.Play(item.LocalPath, item.Title); err != nil {
			log.Printf("Failed to play %s: %v", item.Title, err)
			m.playNextAvailable(item)
		} else {
			m.playTarget = nil
		}
	} else {
		// Just append to playlist
		log.Printf("Appending to playlist: %s", item.Title)
		if err := m.player.Append(item.LocalPath, item.Title); err != nil {
			log.Printf("Failed to append %s: %v", item.Title, err)
		}
	}
}

// ensureID ensures the item has an ID. If not, generates one or extracts it.
func (m *Manager) ensureID(url, id string) string {
	if id != "" {
		return id
	}
	// Try extract
	extracted := m.yt.ExtractID(url)
	if extracted != "" {
		return extracted
	}
	// Fallback: Hash the URL
	hash := sha256.Sum256([]byte(url))
	return hex.EncodeToString(hash[:])[:12]
}

func (m *Manager) Add(url, title, id string) {
	m.mu.Lock()
	id = m.ensureID(url, id)
	item := &QueueItem{
		ID:     id,
		URL:    url,
		Title:  title,
		Status: StatusPending,
	}
	m.queue = append(m.queue, item)
	m.mu.Unlock()

	// Trigger download
	m.downloadChan <- item
}

func (m *Manager) Play(url, title, id string) {
	m.mu.Lock()
	id = m.ensureID(url, id)
	item := &QueueItem{
		ID:     id,
		URL:    url,
		Title:  title,
		Status: StatusPending,
	}
	// Add to end (or replace? user might want history, let's just append)
	m.queue = append(m.queue, item)

	// Set as target
	m.playTarget = item
	m.mu.Unlock()

	// Trigger download (prioritize?)
	// Since channel is buffered, we can't easily jump queue unless we use a priority queue.
	// But usually queue is empty-ish.
	// Ideally we'd push to front of channel?
	// For simplicity, we just push to channel. If channel has backlog, this waits.
	// Optimization: We could have a separate "high priority" channel or method.
	// But let's assume valid usage.
	m.downloadChan <- item
}

// GetQueue returns the current queue state
func (m *Manager) GetQueue() []*QueueItem {
	m.mu.Lock()
	defer m.mu.Unlock()
	// Return copy to be safe?
	cp := make([]*QueueItem, len(m.queue))
	copy(cp, m.queue)
	return cp
}

// GetPlayTarget returns the current item targeted for playback (e.g. buffering/downloading)
func (m *Manager) GetPlayTarget() *QueueItem {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.playTarget
}

// Control Passthroughs
// func (m *Manager) Next() error                                  { return m.player.Next() }
// func (m *Manager) Prev() error                                  { return m.player.Prev() }
func (m *Manager) Pause() error                                 { return m.player.Pause() }
func (m *Manager) Seek(val float64) error                       { return m.player.Seek(val) }
func (m *Manager) SetVolume(val float64) error                  { return m.player.SetVolume(val) }
func (m *Manager) GetStatus() string                            { return m.player.GetStatus() }
func (m *Manager) GetProperty(prop string) (interface{}, error) { return m.player.GetProperty(prop) }

// Next plays the next item in the queue relative to the current one
func (m *Manager) Next() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Get current playing file path
	pathProp, err := m.player.GetProperty("path")
	if err != nil {
		// Fallback to blind next
		return m.player.Next()
	}
	currentPath, ok := pathProp.(string)
	if !ok || currentPath == "" {
		return m.player.Next()
	}

	// Find in queue
	idx := -1
	for i, item := range m.queue {
		if item.LocalPath == currentPath {
			idx = i
			break
		}
	}

	if idx == -1 {
		// Not found, maybe played external file?
		return m.player.Next()
	}

	// Find next valid item
	nextIdx := idx + 1
	if nextIdx >= len(m.queue) {
		return nil // End of queue
	}

	// We have a target index. Use internal logic to play it.
	// We need to release lock to call PlayIndex if we want to reuse it,
	// but PlayIndex takes lock. So we must be careful.
	// Actually PlayIndex logic is simple enough to inline or use helper.
	// Let's unlock and call PlayIndex.
	m.mu.Unlock()
	err = m.PlayIndex(nextIdx)
	m.mu.Lock()
	return err
}

// Prev plays the previous item in the queue
func (m *Manager) Prev() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Get current playing file path
	pathProp, err := m.player.GetProperty("path")
	if err != nil {
		return m.player.Prev()
	}
	currentPath, ok := pathProp.(string)
	if !ok || currentPath == "" {
		return m.player.Prev()
	}

	// Find in queue
	idx := -1
	for i, item := range m.queue {
		if item.LocalPath == currentPath {
			idx = i
			break
		}
	}

	if idx == -1 {
		return m.player.Prev()
	}

	// Find prev valid item
	prevIdx := idx - 1
	if prevIdx < 0 {
		return nil // Start of queue
	}

	m.mu.Unlock()
	err = m.PlayIndex(prevIdx)
	m.mu.Lock()
	return err
}

// PlayIndex plays an item from the queue
// This is tricky because mpv index might differ from our queue index
// if we cleaned up. But currently we don't cleanup.
// Also mpv playlist contains ONLY items that have been appended (Ready).
// Pending items are not in mpv playlist.
// So we can't map index 1:1 easily if there are Pending items in the middle.
// BUT, the UI usually shows what is returned by GetQueue.
// If UI calls PlayIndex(5), and item 5 is Pending, we can't play it yet.
// We should check status.
func (m *Manager) PlayIndex(index int) error {
	m.mu.Lock()
	if index < 0 || index >= len(m.queue) {
		m.mu.Unlock()
		return fmt.Errorf("index out of bounds")
	}
	item := m.queue[index]
	m.mu.Unlock()

	if item.Status == StatusReady || item.Status == StatusPlayed {
		// It is likely in mpv. But where?
		// mpv playlist indices shift if we remove things. We don't remove.
		// BUT items are appended to mpv ONLY when Ready.
		// So mpv list is a subset of m.queue (filtered by Ready).
		// We can't rely on index matching.
		// We'd need to find the item in mpv playlist by filename/title.
		// This is getting complicated.

		// Alternative: Clear mpv and play this file?
		// Or: Don't implement PlayIndex for now, or assume sync.
		// Simplest: Just call player.Play(item.LocalPath) which appends and plays.
		// But that duplicates the entry in mpv.

		if err := m.player.Play(item.LocalPath, item.Title); err != nil {
			log.Printf("Failed to play %s: %v", item.Title, err)
			m.mu.Lock()
			m.playNextAvailable(item)
			m.mu.Unlock()
			return nil
		}
		return nil
	} else if item.Status == StatusPending || item.Status == StatusDownloading {
		// Prioritize it
		m.mu.Lock()
		m.playTarget = item
		m.mu.Unlock()
		return nil // It will play when ready
	}
	return fmt.Errorf("cannot play item with status %s", item.Status)
}

// playNextAvailable attempts to play the next available item in the queue.
// It should be called when the current playTarget fails.
// m.mu must be locked.
func (m *Manager) playNextAvailable(failedItem *QueueItem) {
	// Find index of failed item
	idx := -1
	for i, item := range m.queue {
		if item == failedItem {
			idx = i
			break
		}
	}

	if idx == -1 {
		m.playTarget = nil
		return
	}

	// Try next items
	for i := idx + 1; i < len(m.queue); i++ {
		next := m.queue[i]
		if next.Status != StatusError {
			log.Printf("Skipping failed item '%s', targeting '%s'", failedItem.Title, next.Title)
			m.playTarget = next

			// If ready, play immediately
			if next.Status == StatusReady || next.Status == StatusPlayed {
				if err := m.player.Play(next.LocalPath, next.Title); err != nil {
					log.Printf("Failed to play skipped item %s: %v", next.Title, err)
					continue
				}
				// Success
				m.playTarget = nil
				return
			}

			// If not ready, we have set playTarget. It will play when processed.
			return
		}
	}

	log.Printf("No further items to play in queue")
	m.playTarget = nil
}
