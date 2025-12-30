// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed', err));
}

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const resultsList = document.getElementById('results');
const nowPlaying = document.getElementById('now-playing');
const playPauseBtn = document.getElementById('play-pause-btn');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

playPauseBtn.addEventListener('click', () => control('pause')); // 'pause' toggles in mpv
nextBtn.addEventListener('click', () => control('next'));
prevBtn.addEventListener('click', () => control('prev'));

function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    // If it looks like a URL, play immediately
    if (query.startsWith('http')) {
        playTrack(query, 'Direct URL');
        return;
    }

    fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
            renderResults(data);
        })
        .catch(err => console.error('Search failed', err));
}

function renderResults(results) {
    resultsList.innerHTML = '';
    if (!results || results.length === 0) {
        resultsList.innerHTML = '<li>No results found</li>';
        return;
    }

    results.forEach(item => {
        const li = document.createElement('li');
        li.className = 'result-item';
        li.innerHTML = `
            <img src="${item.thumbnail}" class="thumbnail" alt="thumb">
            <div class="info">
                <span class="title">${item.title}</span>
                <span class="uploader">${item.uploader}</span>
            </div>
        `;
        li.addEventListener('click', () => playTrack(item.url, item.title));
        resultsList.appendChild(li);
    });
}

function playTrack(url, title) {
    fetch('/api/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title })
    })
    .then(res => {
        if (res.ok) {
            updateStatus();
        }
    });
}

function control(action) {
    fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
    });
}

function updateStatus() {
    fetch('/api/status')
        .then(res => res.json())
        .then(data => {
            if (data.current_title) {
                nowPlaying.textContent = data.current_title;
            }
        });
}

// Poll status every 5 seconds
setInterval(updateStatus, 5000);
updateStatus();


