
import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Song {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
}

interface HistoryEntry {
  id: string;
  mood: string;
  date: string;
  time: string;
  songs: Song[];
}

interface PlayerContextType {
  currentSongId: string | null;
  currentSongTitle: string;
  currentSongArtist: string;
  currentSongThumbnail: string;
  isPlaying: boolean;
  history: HistoryEntry[];
  playSong: (id: string, title: string, artist: string, thumbnail: string, mood?: string) => void;
  stopPlayback: () => void;
  setIsPlaying: (playing: boolean) => void;
  clearHistory: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// Generate unique ID for history entries
const generateId = () => Math.random().toString(36).substring(2, 15);

// Get current date and time formatted
const getCurrentDate = () => {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return { date, time };
};

// Load history from localStorage if available
const loadHistory = (): HistoryEntry[] => {
  try {
    const savedHistory = localStorage.getItem('playbackHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  } catch (error) {
    console.error('Error loading history from localStorage:', error);
    return [];
  }
};

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [currentSongTitle, setCurrentSongTitle] = useState('');
  const [currentSongArtist, setCurrentSongArtist] = useState('');
  const [currentSongThumbnail, setCurrentSongThumbnail] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  
  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('playbackHistory', JSON.stringify(history));
  }, [history]);

  const playSong = (id: string, title: string, artist: string, thumbnail: string, mood: string = 'Music') => {
    setCurrentSongId(id);
    setCurrentSongTitle(title);
    setCurrentSongArtist(artist);
    setCurrentSongThumbnail(thumbnail);
    setIsPlaying(true);
    
    // Add to history
    const song = { id, title, artist, thumbnail };
    const { date, time } = getCurrentDate();
    
    setHistory(prevHistory => {
      // Check if we already have a history entry for this mood at this exact time
      const existingEntryIndex = prevHistory.findIndex(entry => 
        entry.mood === mood && entry.date === date && entry.time === time
      );
      
      if (existingEntryIndex !== -1) {
        // Update existing entry by adding this song if not already in it
        const existingEntry = prevHistory[existingEntryIndex];
        const songExists = existingEntry.songs.some(s => s.id === id);
        
        if (!songExists) {
          const updatedEntry = {
            ...existingEntry,
            songs: [song, ...existingEntry.songs]
          };
          
          const newHistory = [...prevHistory];
          newHistory[existingEntryIndex] = updatedEntry;
          return newHistory;
        }
        
        return prevHistory;
      } else {
        // Create a new history entry
        const newEntry: HistoryEntry = {
          id: generateId(),
          mood,
          date,
          time,
          songs: [song]
        };
        
        return [newEntry, ...prevHistory];
      }
    });
    
    toast.success(`Now playing: ${title}`, {
      description: artist,
      duration: 3000,
    });
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setCurrentSongId(null);
    setCurrentSongTitle('');
    setCurrentSongArtist('');
    setCurrentSongThumbnail('');
  };
  
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('playbackHistory');
    toast.success('History cleared successfully');
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSongId,
        currentSongTitle,
        currentSongArtist,
        currentSongThumbnail,
        isPlaying,
        history,
        playSong,
        stopPlayback,
        setIsPlaying,
        clearHistory,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
};
