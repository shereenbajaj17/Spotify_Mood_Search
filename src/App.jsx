import React from 'react';
import { Home, Search, Library, Plus, ArrowRight, ArrowLeft, ChevronRight, ChevronLeft, Play, LayoutGrid, List, MonitorSpeaker, Mic2, Maximize2, Volume2, Volume1, Volume, VolumeX, Heart, Pause, SkipBack, SkipForward, Repeat, Shuffle, Trash2, Edit2 } from 'lucide-react';
import './App.css';
import { usePlayer } from './context/PlayerContext';

const MOCK_TRACKS = [
  { id: 1, title: "Starboy", artist: "The Weeknd, Daft Punk", imgClass: "img-3", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", vibes: ['night', 'cool', 'energetic', 'party'] },
  { id: 2, title: "Midnight City", artist: "M83", imgClass: "gradient-1", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", vibes: ['chill', 'travel', 'nostalgia', 'dreamy'] },
  { id: 3, title: "Get Lucky", artist: "Daft Punk", imgClass: "img-1", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", vibes: ['happy', 'summer', 'dance', 'fun'] },
  { id: 4, title: "Blinding Lights", artist: "The Weeknd", imgClass: "img-0", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", vibes: ['fast', 'night', 'drive', 'retro'] },
  { id: 5, title: "Levitating", artist: "Dua Lipa", imgClass: "img-2", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", vibes: ['pop', 'dance', 'happy', 'party'] },
  { id: 6, title: "Don't Start Now", artist: "Dua Lipa", imgClass: "gradient-2", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", vibes: ['breakup', 'empowering', 'dance', 'pop'] },
];

const getVibeScore = (track, query) => {
  if (!query) return 0;
  const terms = query.toLowerCase().split(' ');
  let score = 0;
  terms.forEach(term => {
    if (track.vibes.some(v => v.includes(term))) score += 2; // Strong vibe match
    if (track.title.toLowerCase().includes(term) || track.artist.toLowerCase().includes(term)) score += 1; // Standard text match
  });
  return score;
};

function App() {
  const { currentTrack, isPlaying, playTrack, togglePlay, nextTrack, prevTrack, seekTo, currentTime, duration, toggleLike, isLiked, volume, isMuted, setAudioVolume, toggleMute, playlists, createPlaylist, deletePlaylist, renamePlaylist, addTrackToPlaylist, removeTrackFromPlaylist, likedSongs, queue, currentTrackIndex, addToQueue, playQueueTrack } = usePlayer();
  const [view, setView] = React.useState('home');
  const [activePlaylistId, setActivePlaylistId] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [contextMenu, setContextMenu] = React.useState(null); // { x, y, track, playlistId }

  // Close context menu on click elsewhere
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e, track = null, playlistId = null) => {
    e.preventDefault();
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      track,
      playlistId
    });
  };

  const createAndNav = () => {
    const id = createPlaylist();
    setActivePlaylistId(id);
    setView('playlist');
  };

  const handlePlay = (track, e) => {
    e.stopPropagation();
    playTrack(track, MOCK_TRACKS); // Pass the full list as the queue context
  };

  const isCurrentTrack = (trackId) => currentTrack?.id === trackId;

  return (
    <>
      <aside className="sidebar">
        <div className="nav-section card-style">
          <div className="logo">
            <span style={{ fontWeight: 700, fontSize: '24px', color: 'white' }}>Spotify</span>
          </div>
          <nav>
            <a href="#" className={`nav-item ${view === 'home' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('home'); }}>
              <Home size={24} strokeWidth={2.5} />
              <span>Home</span>
            </a>
            <a href="#" className={`nav-item ${view === 'search' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('search'); }}>
              <Search size={24} strokeWidth={2.5} />
              <span>Search</span>
            </a>
          </nav>
        </div>

        <div className="library-section card-style">
          <div className="lib-header">
            <div className="lib-toggle">
              <button className="lib-btn">
                <Library size={24} strokeWidth={2.5} />
                <span>Your Library</span>
              </button>
            </div>
            <div className="lib-controls">
              <button className="icon-btn" onClick={createAndNav}>
                <Plus size={20} />
              </button>
              <button className="icon-btn">
                <ArrowRight size={20} />
              </button>
            </div>
          </div>

          <div className="tags-scroll">
            <span className="pill">Playlists</span>
            <span className="pill">Artists</span>
            <span className="pill">Podcasts & Shows</span>
          </div>

          <div className="lib-search-header">
            <button className="icon-btn xs"><Search size={16} /></button>
            <button className="sort-btn">
              <span>Recents</span>
              <List size={16} />
            </button>
          </div>

          <div className="playlist-list custom-scroll">
            <div className={`list-item ${view === 'liked' ? 'active' : ''}`} onClick={() => setView('liked')}>
              <div className="skel-img gradient-1">
                <Heart size={20} fill="white" stroke="none" />
              </div>
              <div className="list-text">
                <div className="list-title">Liked Songs</div>
                <div className="list-sub">
                  <div className="pin-icon">📌</div>
                  <span>Playlist • {likedSongs.size} songs</span>
                </div>
              </div>
            </div>

            {playlists.filter(p => p.id !== 'liked').map((pl) => (
              <div key={pl.id} className={`list-item ${activePlaylistId === pl.id && view === 'playlist' ? 'active' : ''}`}
                onClick={() => { setActivePlaylistId(pl.id); setView('playlist'); }}
                onContextMenu={(e) => handleContextMenu(e, null, pl.id)}
              >
                <div className="skel-img img-0" style={{ borderRadius: 4 }}></div>
                <div className="list-text">
                  <div className={`list-title ${activePlaylistId === pl.id && view === 'playlist' ? 'active' : ''}`}>{pl.name}</div>
                  <div className="list-sub">Playlist • {pl.tracks.length} songs</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="main-view card-style">
        <header className="top-bar">
          <div className="nav-controls">
            {view === 'search' && (
              <div className="search-container">
                <Search size={20} className="search-icon-input" />
                <input
                  type="text"
                  placeholder="What do you want to play?"
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            )}
          </div>
          <div className="user-controls">
            <button className="circle-btn user-icon">
              <div className="avatar">S</div>
            </button>
          </div>
        </header>

        <div className="content-scroll custom-scroll">
          {view === 'home' ? (
            <>
              <section className="good-morning">
                <h2>Good morning</h2>
                <div className="hero-grid">
                  {MOCK_TRACKS.slice(0, 6).map((track, i) => (
                    <div key={track.id} className="hero-card"
                      onClick={() => playTrack(track, MOCK_TRACKS)}
                      onContextMenu={(e) => handleContextMenu(e, track)}
                    >
                      <div className={`hero-img ${track.imgClass}`}>
                        {isLiked(track.id) && <Heart size={24} fill="#1ed760" stroke="#1ed760" />}
                      </div>
                      <span>{track.title}</span>
                      <div className="play-btn-hover" style={{ opacity: isCurrentTrack(track.id) ? 1 : undefined, transform: isCurrentTrack(track.id) ? 'translateY(0)' : undefined }}>
                        <div className="play-icon-circle" onClick={(e) => handlePlay(track, e)}>
                          {isCurrentTrack(track.id) && isPlaying ? (
                            <Pause size={20} fill="black" stroke="black" />
                          ) : (
                            <Play size={20} fill="black" className="play-arrow" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="shelf">
                <div className="shelf-header">
                  <h2>Recently played</h2>
                  <span className="see-all">Show all</span>
                </div>
                <div className="card-row">
                  {MOCK_TRACKS.slice(0, 4).map((track, i) => (
                    <div key={track.id} className="content-card"
                      onClick={() => playTrack(track, MOCK_TRACKS)}
                      onContextMenu={(e) => handleContextMenu(e, track)}
                    >
                      <div className="card-img-container">
                        <div className={`card-img ${track.imgClass}`}></div>
                        <div className="card-play-btn" style={{ opacity: isCurrentTrack(track.id) ? 1 : undefined, transform: isCurrentTrack(track.id) ? 'translateY(0)' : undefined }}>
                          <div className="play-icon-circle large">
                            {isCurrentTrack(track.id) && isPlaying ? (
                              <Pause size={24} fill="black" stroke="black" />
                            ) : (
                              <Play size={24} fill="black" className="play-arrow" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="card-text">
                        <div className="card-title">{track.title}</div>
                        <div className="card-sub">{track.artist}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <footer className="main-footer">
                <div className="footer-cols">
                  <div className="col">
                    <h4>Company</h4>
                    <a href="#">About</a>
                    <a href="#">Jobs</a>
                    <a href="#">For the Record</a>
                  </div>
                  <div className="col">
                    <h4>Communities</h4>
                    <a href="#">For Artists</a>
                    <a href="#">Developers</a>
                    <a href="#">Advertising</a>
                  </div>
                  <div className="col">
                    <h4>Useful links</h4>
                    <a href="#">Support</a>
                    <a href="#">Free Mobile App</a>
                  </div>
                </div>
                <div className="footer-legal">
                  <span>© 2024 Spotify AB</span>
                </div>
              </footer>
            </>
          ) : view === 'search' ? (
            <div className="search-view">
              {!searchQuery ? (
                <div className="empty-search">
                  <h2>Browse all</h2>
                  <p style={{ color: '#b3b3b3', marginBottom: 24 }}>Search by mood, energy, or feeling...</p>
                  <div className="browse-grid">
                    <div className="browse-card" style={{ background: 'rgb(220, 20, 140)' }} onClick={() => setSearchQuery('party')}>Party</div>
                    <div className="browse-card" style={{ background: 'rgb(0, 100, 80)' }} onClick={() => setSearchQuery('chill')}>Chill</div>
                    <div className="browse-card" style={{ background: 'rgb(80, 55, 80)' }} onClick={() => setSearchQuery('night')}>Night</div>
                  </div>
                </div>
              ) : (
                <div className="search-results">
                  {(() => {
                    // Vibe Search Logic
                    const vibeResults = MOCK_TRACKS
                      .map(t => ({ ...t, score: getVibeScore(t, searchQuery) }))
                      .filter(t => t.score > 0)
                      .sort((a, b) => b.score - a.score);

                    const topMatch = vibeResults.length > 0 ? vibeResults[0] : null;

                    if (vibeResults.length === 0) return (
                      <div style={{ textAlign: 'center', marginTop: 40, color: '#b3b3b3' }}>
                        <p>No vibe matches found.</p>
                        <p>Try searching for "chill", "party", or "night".</p>
                      </div>
                    );

                    return (
                      <div className="results-grid">
                        <div className="top-result-col">
                          <h3>Top Vibe Match</h3>
                          {topMatch && (
                            <div className="top-result-card card-style"
                              onClick={() => playTrack(topMatch, vibeResults)}
                              onContextMenu={(e) => handleContextMenu(e, topMatch)}>
                              <div className={`hero-img large ${topMatch.imgClass}`}></div>
                              <div className="top-res-title">{topMatch.title}</div>
                              <div className="top-res-sub">
                                <span className="pill-dark">Vibe Match</span>
                                <span style={{ marginLeft: 8 }}>{topMatch.artist}</span>
                              </div>
                              <div style={{ marginTop: 8 }}>
                                {topMatch.vibes.map(v => <span key={v} style={{ fontSize: 12, opacity: 0.7, marginRight: 6 }}>#{v}</span>)}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="songs-col">
                          <h3>Vibe Results</h3>
                          {vibeResults.slice(0, 4).map(track => (
                            <div key={track.id} className="list-item search-item"
                              onClick={() => playTrack(track, vibeResults)}
                              onContextMenu={(e) => handleContextMenu(e, track)}
                            >
                              <div className={`skel-img ${track.imgClass}`}></div>
                              <div className="list-text">
                                <div className="list-title">{track.title}</div>
                                <div className="list-sub" style={{ display: 'flex', gap: 6 }}>
                                  {track.vibes.slice(0, 2).map(v => <span key={v} style={{ color: '#1ed760' }}>#{v}</span>)}
                                </div>
                              </div>
                              <div style={{ marginLeft: 'auto' }}>
                                <Heart size={16} fill={isLiked(track.id) ? "#1ed760" : "none"} stroke={isLiked(track.id) ? "#1ed760" : "currentColor"}
                                  onClick={(e) => { e.stopPropagation(); toggleLike(track.id) }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          ) : view === 'liked' ? (
            <div className="playlist-view">
              <div className="playlist-header">
                <div className="playlist-art-large gradient-1 shadow-2xl">
                  <Heart size={80} fill="white" stroke="none" />
                </div>
                <div className="playlist-details">
                  <span className="overline-text">Playlist</span>
                  <h1 className="playlist-title">Liked Songs</h1>
                  <div className="playlist-meta">
                    <span className="user-name-bold">User</span>
                    <span>• {likedSongs.size} songs</span>
                  </div>
                </div>
              </div>

              <div className="playlist-actions">
                <button className="green-large" onClick={() => {
                  const likedTracks = MOCK_TRACKS.filter(t => likedSongs.has(t.id));
                  if (likedTracks.length) playTrack(likedTracks[0], likedTracks);
                }}>
                  <Play size={24} fill="black" className="play-arrow" />
                </button>
              </div>

              <div className="playlist-tracks">
                <div className="track-list-header">
                  <span>#</span>
                  <span>Title</span>
                  <span>Date added</span>
                  <span><MonitorSpeaker size={16} /></span>
                </div>
                <div className="tracks-hr"></div>
                {(() => {
                  const likedTracks = MOCK_TRACKS.filter(t => likedSongs.has(t.id));
                  if (likedTracks.length === 0) {
                    return (
                      <div className="empty-playlist-state">
                        <h3>Songs you like will appear here</h3>
                        <p>Save songs by tapping the heart icon.</p>
                        <p><a href="#" onClick={(e) => { e.preventDefault(); setView('search') }}>Find songs</a></p>
                      </div>
                    )
                  }
                  return likedTracks.map((track, i) => (
                    <div key={`${track.id}`} className="list-item playlist-row"
                      onClick={() => playTrack(track, likedTracks)}
                      onContextMenu={(e) => handleContextMenu(e, track)}
                    >
                      <div className="row-idx">
                        {isCurrentTrack(track.id) ? <img src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2ef4.gif" width="14" /> : i + 1}
                      </div>
                      <div className="row-title">
                        <div className={`skel-img small ${track.imgClass}`}></div>
                        <div className="col-text">
                          <div className={`list-title ${isCurrentTrack(track.id) ? 'active' : ''}`}>{track.title}</div>
                          <div className="list-sub">{track.artist}</div>
                        </div>
                      </div>
                      <div className="row-date">2 days ago</div>
                      <div className="row-dur">2:45</div>
                      <div style={{ marginLeft: 'auto', paddingRight: 16 }}>
                        <Heart size={16} fill="#1ed760" stroke="#1ed760" onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }} />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          ) : view === 'queue' ? (
            <div className="queue-view">
              <div className="queue-header">Queue</div>
              <h3 className="queue-sect-title">Now Playing</h3>
              {currentTrack && (
                <div className="list-item queue-item active-row">
                  <div className="row-idx"><img src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2ef4.gif" width="14" /></div>
                  <div className="row-title">
                    <div className={`skel-img small ${currentTrack.imgClass}`}></div>
                    <span style={{ marginLeft: 16 }}>{currentTrack.title}</span>
                  </div>
                </div>
              )}
              <h3 className="queue-sect-title">Next Up</h3>
              <div className="playlist-tracks">
                {queue.length > 0 && currentTrackIndex < queue.length - 1 ? (
                  queue.slice(currentTrackIndex + 1).map((track, i) => (
                    <div key={`${track.id}-${i}`} className="list-item queue-item"
                      onClick={() => playQueueTrack(currentTrackIndex + 1 + i)}
                      onContextMenu={(e) => handleContextMenu(e, track)}
                    >
                      <div className="row-idx">{i + 1}</div>
                      <div className="row-title">
                        <div className={`skel-img small ${track.imgClass}`}></div>
                        <span style={{ marginLeft: 16 }}>{track.title}</span>
                      </div>
                    </div>
                  ))
                ) : <div className="empty-queue">No upcoming songs.</div>}
              </div>
            </div>
          ) : view === 'playlist' ? (
            (() => {
              const playlist = playlists.find(p => p.id === activePlaylistId);
              if (!playlist) {
                return (
                  <div className="empty-playlist-state">
                    <h3>Playlist not found</h3>
                    <p>This playlist may have been deleted.</p>
                    <button className="pill-btn-dark" onClick={() => setView('home')}>Go Home</button>
                  </div>
                );
              }

              return (
                <div className="playlist-view">
                  <div className="playlist-header">
                    <div className="playlist-art-large shadow-2xl" style={{ background: '#282828' }}>
                      <span style={{ fontSize: 64 }}>🎵</span>
                    </div>
                    <div className="playlist-details">
                      <span className="overline-text">Playlist</span>
                      <h1 className="playlist-title" onClick={() => {
                        const newName = prompt("Rename", playlist.name);
                        if (newName) renamePlaylist(playlist.id, newName);
                      }}>{playlist.name}</h1>
                      <div className="playlist-meta">
                        <span className="user-name-bold">User</span>
                        <span>• {playlist.tracks.length} songs</span>
                      </div>
                    </div>
                  </div>

                  <div className="playlist-actions">
                    <button className="green-large" onClick={() => playlist.tracks.length > 0 && playTrack(playlist.tracks[0], playlist.tracks)}>
                      <Play size={24} fill="black" className="play-arrow" />
                    </button>
                    <button className="icon-btn" onClick={() => {
                      if (confirm("Delete this playlist?")) {
                        deletePlaylist(playlist.id);
                        setView('home');
                      }
                    }} style={{ marginLeft: 24, color: '#b3b3b3' }}>
                      <MoreHorizontal />
                    </button>
                  </div>

                  <div className="playlist-tracks">
                    <div className="track-list-header">
                      <span>#</span>
                      <span>Title</span>
                      <span>Date added</span>
                      <span><MonitorSpeaker size={16} /></span>
                    </div>
                    <div className="tracks-hr"></div>

                    {playlist.tracks.length === 0 ? (
                      <div className="empty-playlist-state">
                        <h3>Let's find some songs for your playlist</h3>
                        <div className="search-input-container" style={{ maxWidth: 400, margin: '24px auto' }}>
                          <Search size={20} className="search-icon-input" />
                          <input
                            type="text"
                            placeholder="Search for songs"
                            className="search-input"
                            onFocus={() => setView('search')}
                          />
                        </div>
                      </div>
                    ) : (
                      playlist.tracks.map((track, i) => (
                        <div key={`${track.id}-${i}`} className="list-item playlist-row"
                          onClick={() => playTrack(track, playlist.tracks)}
                          onContextMenu={(e) => handleContextMenu(e, track, playlist.id)}
                        >
                          <div className="row-idx">
                            {isCurrentTrack(track.id) ? <img src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2ef4.gif" width="14" /> : i + 1}
                          </div>
                          <div className="row-title">
                            <div className={`skel-img small ${track.imgClass}`}></div>
                            <div className="col-text">
                              <div className={`list-title ${isCurrentTrack(track.id) ? 'active' : ''}`}>{track.title}</div>
                              <div className="list-sub">{track.artist}</div>
                            </div>
                          </div>
                          <div className="row-date">Just now</div>
                          <div className="row-dur">2:45</div>
                          <div style={{ marginLeft: 'auto', paddingRight: 16 }}>
                            <Heart size={16} fill={isLiked(track.id) ? "#1ed760" : "none"} stroke={isLiked(track.id) ? "#1ed760" : "currentColor"}
                              onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })()
          ) : null}
        </div>
      </main>

      <aside className="now-playing card-style">
        <div className="np-header">
          <span>Now Playing</span>
          <div className="np-controls">
            <button className="icon-btn"><MoreHorizontal /></button>
          </div>
        </div>

        {currentTrack ? (
          <>
            <div className="np-art large-shadow">
              <div className={`np-img-contain ${currentTrack.imgClass}`}></div>
            </div>
            <div className="np-track-info">
              <div className="track-head">
                <div className="track-link-title">{currentTrack.title}</div>
                <div className="track-link-artist">{currentTrack.artist}</div>
              </div>
              <div className="action-buttons">
                <button className="icon-btn-small" onClick={() => toggleLike(currentTrack.id)}>
                  <Heart size={20} fill={isLiked(currentTrack.id) ? "#1ed760" : "none"} stroke={isLiked(currentTrack.id) ? "#1ed760" : "currentColor"} />
                </button>
              </div>
            </div>

            <div className="np-player-controls">
              <button className="icon-btn" style={{ color: '#b3b3b3' }}><Shuffle size={16} /></button>
              <button className="icon-btn" onClick={prevTrack}><SkipBack size={20} fill="currentColor" /></button>
              <button className="play-icon-circle" style={{ width: 32, height: 32, transform: 'none' }} onClick={togglePlay}>
                {isPlaying ? (
                  <Pause size={16} fill="black" stroke="black" />
                ) : (
                  <Play size={16} fill="black" className="play-arrow" style={{ marginLeft: 2 }} />
                )}
              </button>
              <button className="icon-btn" onClick={nextTrack}><SkipForward size={20} fill="currentColor" /></button>
              <button className="icon-btn" style={{ color: '#b3b3b3' }}><Repeat size={16} /></button>
            </div>

            <div className="np-card-about">
              <div className="about-header">About the artist</div>
              <div className={`artist-img ${currentTrack.imgClass}`}></div>
              <div className="artist-name-bold">{currentTrack.artist}</div>
              <div className="monthly-listeners">
                <span>105,432,100 monthly listeners</span>
              </div>
              <p className="artist-desc">
                {currentTrack.artist} is a popular artist known for their unique sound and style.
              </p>
            </div>
          </>
        ) : (
          <div style={{ padding: '20px', color: '#a7a7a7', textAlign: 'center' }}>
            <p>Play a track to see details here.</p>
          </div>
        )}
      </aside>

      <footer className="bottom-player">
        {currentTrack ? (
          <>
            <div className="bp-left">
              <div className={`bp-img ${currentTrack.imgClass}`}></div>
              <div className="bp-info">
                <div className="bp-title">{currentTrack.title}</div>
                <div className="bp-artist">{currentTrack.artist}</div>
              </div>
              <button className="icon-btn-small" onClick={() => toggleLike(currentTrack.id)}>
                <Heart size={16} fill={isLiked(currentTrack.id) ? "#1ed760" : "none"} stroke={isLiked(currentTrack.id) ? "#1ed760" : "currentColor"} />
              </button>
            </div>

            <div className="bp-center">
              <div className="bp-controls">
                <button className="icon-btn xs-text"><Shuffle size={16} /></button>
                <button className="icon-btn" onClick={prevTrack}><SkipBack size={20} fill="currentColor" /></button>
                <button className="circle-btn-white" onClick={togglePlay}>
                  {isPlaying ? <Pause size={16} fill="black" stroke="black" /> : <Play size={16} fill="black" className="play-arrow-small" />}
                </button>
                <button className="icon-btn" onClick={nextTrack}><SkipForward size={20} fill="currentColor" /></button>
                <button className="icon-btn xs-text"><Repeat size={16} /></button>
              </div>
              <div className="bp-progress">
                <span className="time-text">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  className="progress-bar"
                  onChange={(e) => seekTo(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #1ed760 ${(currentTime / duration) * 100}%, #4d4d4d ${(currentTime / duration) * 100}%)`
                  }}
                />
                <span className="time-text">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="bp-right">
              <button className="icon-btn"><Mic2 size={16} /></button>
              <button className="icon-btn" onClick={() => setView(view === 'queue' ? 'home' : 'queue')}>
                <List size={16} style={{ color: view === 'queue' ? '#1ed760' : undefined }} />
              </button>
              <button className="icon-btn"><MonitorSpeaker size={16} /></button>
              <div className="vol-group">
                <button className="icon-btn" onClick={toggleMute} style={{ marginRight: 4 }}>
                  {isMuted || volume === 0 ? <VolumeX size={16} /> : volume < 0.5 ? <Volume1 size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  className="progress-bar vol-slider"
                  onChange={(e) => setAudioVolume(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #1ed760 ${(isMuted ? 0 : volume) * 100}%, #4d4d4d ${(isMuted ? 0 : volume) * 100}%)`
                  }}
                />
              </div>
              <button className="icon-btn"><Maximize2 size={16} /></button>
            </div>
          </>
        ) : (
          <div className="bp-empty"></div>
        )}
      </footer>

      {contextMenu && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          {contextMenu.track && !contextMenu.playlistId && (
            <>
              <div className="ctx-item disabled">Add to Playlist</div>
              <div className="ctx-sep"></div>
              {playlists.filter(p => p.id !== 'liked').map(pl => (
                <div key={pl.id} className="ctx-item" onClick={() => {
                  addTrackToPlaylist(pl.id, contextMenu.track);
                  setContextMenu(null);
                  alert(`Added to ${pl.name}`);
                }}>
                  <span>{pl.name}</span>
                </div>
              ))}
            </>
          )}
          {contextMenu.playlistId && !contextMenu.track && (
            <>
              <div className="ctx-item" onClick={() => {
                const pl = playlists.find(p => p.id === contextMenu.playlistId);
                const newName = prompt("Rename playlist", pl.name);
                if (newName) renamePlaylist(pl.id, newName);
                setContextMenu(null);
              }}>
                <Edit2 size={16} style={{ marginRight: 8 }} /> Rename
              </div>
              <div className="ctx-item" onClick={() => {
                if (confirm("Delete this playlist?")) {
                  deletePlaylist(contextMenu.playlistId);
                }
                setContextMenu(null);
              }}>
                <Trash2 size={16} style={{ marginRight: 8 }} /> Delete
              </div>
            </>
          )}
          {contextMenu.playlistId && contextMenu.track && (
            <div className="ctx-item" onClick={() => {
              removeTrackFromPlaylist(contextMenu.playlistId, contextMenu.track.id);
              setContextMenu(null);
            }}>
              Remove from this playlist
            </div>
          )}
        </div>
      )}
    </>
  )
}

function formatTime(seconds) {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function MoreHorizontal() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  )
}

export default App
