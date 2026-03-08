import { createContext, useContext, useState, useRef, useEffect } from 'react';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [queue, setQueue] = useState([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playlists, setPlaylists] = useState([
        { id: 'liked', name: 'Liked Songs', tracks: [] } 
    ]);
    const [likedSongs, setLikedSongs] = useState(new Set()); 
    const [recentlyPlayed, setRecentlyPlayed] = useState([]);

    const audioRef = useRef(new Audio());

    // Handle Playback Logic and Auto-play
    useEffect(() => {
        const audio = audioRef.current;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => setDuration(audio.duration);

        // Auto-play next track when ended
        const handleEnded = () => {
            setIsPlaying(false);
            nextTrack();
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [queue, currentTrackIndex]); // Re-bind if necessary constraints change

    // Play a specific track and set the queue context
    const playTrack = (track, contextList = []) => {
        // If playing the same track, just toggle
        if (currentTrack?.id === track.id) {
            togglePlay();
            return;
        }

        // Update queue if a new context list is provided (e.g. clicking a song in a list)
        // If contextList is empty, we just play the track. Ideally, we should set the queue to this single track or keep existing?
        // For this implementation, let's assume if contextList is passed, we replace the queue.
        if (contextList.length > 0) {
            setQueue(contextList);
            const index = contextList.findIndex(t => t.id === track.id);
            setCurrentTrackIndex(index !== -1 ? index : 0);
        }

        // Fallback to local audio element (for mock tracks)
        _playAudio(track);
    };

    const _playAudio = (track) => {
        const audio = audioRef.current;
        if (!audio) return;
        
        // Stop current playing audio properly to make the source truly switch
        audio.pause();
        
        audio.src = track.audioUrl;
        audio.load();
        
        audio.play().then(() => {
            setIsPlaying(true);
            
            // Add to recently played (avoiding back-to-back duplicates)
            setRecentlyPlayed(prev => {
                const isDuplicate = prev.length > 0 && prev[0].id === track.id;
                if (isDuplicate) return prev;
                // keep up to 10 recently played items
                return [track, ...prev].slice(0, 10);
            });
            
        }).catch(e => console.error("Audio play error:", e));
        
        setCurrentTrack(track);
    };

    const togglePlay = async () => {
        if (!currentTrack) return;
        
        // Fallback Local
        const audio = audioRef.current;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            if (audio.src) {
                audio.play().catch(e => console.error("Resume error:", e));
                setIsPlaying(true);
            } else if (currentTrack) {
                _playAudio(currentTrack);
            }
        }
    };

    const nextTrack = () => {
        if (queue.length === 0 || currentTrackIndex === -1) return;

        const nextIndex = currentTrackIndex + 1;
        if (nextIndex < queue.length) {
            const nextTrack = queue[nextIndex];
            setCurrentTrackIndex(nextIndex);
            _playAudio(nextTrack);
        } else {
            // End of queue
            setIsPlaying(false);
        }
    };

    const prevTrack = () => {
        const audio = audioRef.current;
        // If more than 3 seconds in, restart song
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
            return;
        }

        if (queue.length === 0 || currentTrackIndex === -1) return;

        const prevIndex = currentTrackIndex - 1;
        if (prevIndex >= 0) {
            const prevTrack = queue[prevIndex];
            setCurrentTrackIndex(prevIndex);
            _playAudio(prevTrack);
        } else {
            // Keep playing current if at start
            audio.currentTime = 0;
        }
    };

    const toggleLike = (trackId) => {
        setLikedSongs(prev => {
            const next = new Set(prev);
            if (next.has(trackId)) {
                next.delete(trackId);
            } else {
                next.add(trackId);
            }
            return next;
        });
    };

    const isLiked = (trackId) => likedSongs.has(trackId);

    const seekTo = (amount) => {
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = amount;
            setCurrentTime(amount);
        }
    };

    const setAudioVolume = (vol) => {
        setVolume(vol);
        if (isMuted) return; // Leave at 0 internally but save preference
        
        audioRef.current.volume = vol;
    };

    const toggleMute = () => {
        const audio = audioRef.current;
        if (isMuted) {
            audio.volume = volume;
            setIsMuted(false);
        } else {
            audio.volume = 0;
            setIsMuted(true);
        }
    };

    // Playlist Logic
    const createPlaylist = () => {
        const newId = Date.now().toString();
        const newPlaylist = {
            id: newId,
            name: `My Playlist #${playlists.length + 1}`,
            tracks: []
        };
        setPlaylists(prev => [...prev, newPlaylist]);
        return newId;
    };

    const deletePlaylist = (id) => {
        setPlaylists(prev => prev.filter(p => p.id !== id));
    };

    const renamePlaylist = (id, newName) => {
        setPlaylists(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    };

    const addTrackToPlaylist = (playlistId, track) => {
        setPlaylists(prev => prev.map(p => {
            if (p.id === playlistId) {
                // Prevent duplicates
                if (p.tracks.some(t => t.id === track.id)) return p;
                return { ...p, tracks: [...p.tracks, track] };
            }
            return p;
        }));
    };

    const removeTrackFromPlaylist = (playlistId, trackId) => {
        setPlaylists(prev => prev.map(p => {
            if (p.id === playlistId) {
                return { ...p, tracks: p.tracks.filter(t => t.id !== trackId) };
            }
            return p;
        }));
    };

    // Queue Logic
    const addToQueue = (track) => {
        setQueue(prev => [...prev, track]);
    };

    const playQueueTrack = (index) => {
        if (index >= 0 && index < queue.length) {
            setCurrentTrackIndex(index);
            _playAudio(queue[index]);
        }
    };

    return (
        <PlayerContext.Provider value={{
            currentTrack,
            isPlaying,
            currentTime,
            duration,
            playTrack,
            togglePlay,
            nextTrack,
            prevTrack,
            seekTo,
            toggleLike,
            isLiked,
            volume,
            isMuted,
            setAudioVolume,
            toggleMute,
            playlists,
            createPlaylist,
            deletePlaylist,
            renamePlaylist,
            addTrackToPlaylist,
            removeTrackFromPlaylist,
            likedSongs,
            setLikedSongs,
            recentlyPlayed,
            queue,
            currentTrackIndex,
            addToQueue,
            playQueueTrack,
            playQueueTrack
        }}>
            {children}
        </PlayerContext.Provider>
    );
};
