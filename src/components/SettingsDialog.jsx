import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger } from
'@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, Coffee, Book, ExternalLink, CloudOff, LogOut, User, Download, Upload, ArrowUpDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'@/components/ui/select';
import { songStorage } from '@/components/storage/songStorage';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthContext';

export default function SettingsDialog({
  isOpen,
  onOpenChange,
  onSetDefaultPlaylist,
  sortOrder,
  onSortOrderChange
}) {
  const { user: spotifyUser, logout } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [selectedDefaultPlaylist, setSelectedDefaultPlaylist] = useState('');
  const [isDryRun, setIsDryRun] = useState(localStorage.getItem('is_dry_run') === 'true');
  const [removeFromPlaylists, setRemoveFromPlaylists] = useState(() => {
    const saved = localStorage.getItem('remove_from_playlists');
    return saved === null ? true : saved === 'true';
  });
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cachedPlaylists = songStorage.getPlaylists();
      setPlaylists(cachedPlaylists);

      const saved = localStorage.getItem('spotify_default_star_playlist');
      if (saved) {
        setSelectedDefaultPlaylist(saved);
      }
    }
  }, [isOpen]);

  const handleDefaultPlaylistChange = (playlistId) => {
    setSelectedDefaultPlaylist(playlistId);
    localStorage.setItem('spotify_default_star_playlist', playlistId);
    const playlist = playlists.find((p) => p.id === playlistId);
    if (playlist) {
      onSetDefaultPlaylist?.(playlist);
      toast.success(`Default star playlist set to "${playlist.name}"`);
    }
  };

  const handleDryRunChange = (checked) => {
    setIsDryRun(checked);
    localStorage.setItem('is_dry_run', checked.toString());
    toast.success(`Dry run mode ${checked ? 'enabled' : 'disabled'}`);
  };

  const handleRemoveFromPlaylistsChange = (checked) => {
    setRemoveFromPlaylists(checked);
    localStorage.setItem('remove_from_playlists', checked.toString());
    toast.success(`Auto-remove from playlists ${checked ? 'enabled' : 'disabled'}`);
  };

  const handleSendFeedback = () => {
    if (!feedbackMessage.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    window.open('mailto:daniel@d1dx.com?subject=Cleander Feedback&body=' + encodeURIComponent(feedbackMessage));
  };

  const handleDownloadBackup = () => {
    try {
      const backup = songStorage.exportBackup();
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `cleander-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Backup downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download backup');
    }
  };

  const handleUploadBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        const result = songStorage.importBackup(backup);

        if (result.success) {
          toast.success('Backup restored successfully');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          toast.error(`Failed to restore backup: ${result.error}`);
        }
      } catch (error) {
        console.error('Upload failed:', error);
        toast.error('Invalid backup file format');
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read backup file');
      setIsUploading(false);
    };

    reader.readAsText(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-emerald-400 transition-colors">
          <Settings size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Settings</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Customize your Cleander experience
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* User Info */}
          {spotifyUser &&
          <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{spotifyUser.display_name}</p>
                <p className="text-xs text-zinc-400 truncate">{spotifyUser.email}</p>
              </div>
            </div>
          }

          {/* Backup & Restore */}
          <div className="space-y-2">
            <Label className="text-zinc-300 text-sm">Backup & Restore</Label>
            <div className="flex gap-2">
              <Button
              onClick={handleDownloadBackup}
              variant="outline"
              className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">

                <Download size={16} className="mr-2" />
                Download Backup
              </Button>
              
              <label className="flex-1 cursor-pointer">
                <input
                type="file"
                accept=".json"
                onChange={handleUploadBackup}
                disabled={isUploading}
                className="hidden" />

                <span className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 disabled:pointer-events-none disabled:opacity-50 border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 h-9 px-3 text-white">
                  <Upload size={16} className="mr-2" />
                  {isUploading ? 'Restoring...' : 'Restore'}
                </span>
              </label>
            </div>
            <p className="text-xs text-zinc-500">Save and restore your Cleander progress</p>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className="text-zinc-400" />
              <Label className="text-zinc-300 text-sm">Review Order</Label>
            </div>
            <Select value={sortOrder} onValueChange={onSortOrderChange}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                <SelectItem value="liked-asc" className="text-white focus:bg-zinc-700 focus:text-white">
                  Date liked — Oldest first
                </SelectItem>
                <SelectItem value="liked-desc" className="text-white focus:bg-zinc-700 focus:text-white">
                  Date liked — Newest first
                </SelectItem>
                <SelectItem value="title-asc" className="text-white focus:bg-zinc-700 focus:text-white">
                  Title — A → Z
                </SelectItem>
                <SelectItem value="artist-asc" className="text-white focus:bg-zinc-700 focus:text-white">
                  Artist — A → Z
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500">Order in which songs appear for review</p>
          </div>

          {/* Default Playlist */}
          <div className="space-y-2">
            <Label className="text-zinc-300 text-sm">Default Star Playlist</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
              {playlists.length === 0 ?
              <p className="text-xs text-zinc-500">No playlists found</p> :

              playlists.map((playlist) => {
                const isSelected = selectedDefaultPlaylist === playlist.id;
                return (
                  <div
                  key={playlist.id}
                  onClick={() => handleDefaultPlaylistChange(playlist.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                  isSelected ?
                  'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50' :
                  'bg-zinc-800/50 border-2 border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-700/50'}`
                  }>

                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ?
                    'border-emerald-500 bg-emerald-500' :
                    'border-zinc-600'}`
                    }>
                        {isSelected &&
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      }
                      </div>
                      <span className="text-white text-sm flex-1">
                        {playlist.name}
                      </span>
                    </div>);

              })
              }
            </div>
            <p className="text-xs text-zinc-500">Tap star to quick add, long press for more options</p>
          </div>

          {/* Dry Run */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudOff size={16} className="text-zinc-400" />
              <Label className="text-zinc-300 text-sm">Dry Run Mode</Label>
            </div>
            <Switch
            checked={isDryRun}
            onCheckedChange={handleDryRunChange} />

          </div>
          <p className="text-xs text-zinc-500 -mt-2">Test without making changes to Spotify</p>

          {/* Remove from Playlists */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-zinc-300 text-sm">Remove from playlists</Label>
            </div>
            <Switch
            checked={removeFromPlaylists}
            onCheckedChange={handleRemoveFromPlaylistsChange} />

          </div>
          <p className="text-xs text-zinc-500 -mt-2">Auto-remove songs from playlists when removing from library</p>

          {/* Feedback */}
          <div className="space-y-2">
            <Label className="text-zinc-300 text-sm">Send Feedback</Label>
            <Textarea
            placeholder="Share your thoughts or report issues..."
            value={feedbackMessage}
            onChange={(e) => setFeedbackMessage(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white text-sm min-h-[80px]" />

            <Button
            onClick={handleSendFeedback}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm">

              Send Feedback
            </Button>
          </div>

          {/* Buy Me a Coffee */}
          <Button
          asChild
          variant="outline"
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500">

            <a href="https://www.buymeacoffee.com/yourprofile" target="_blank" rel="noopener noreferrer">
              <Coffee size={18} className="mr-2" />
              Buy Me a Coffee
              <ExternalLink size={14} className="ml-2" />
            </a>
          </Button>

          {/* Privacy Policy */}
          <div className="text-xs text-zinc-500 space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center gap-1 text-zinc-300 font-semibold">
              <Book size={14} />
              <span>Privacy Policy</span>
            </div>
            <p className="leading-relaxed">
              This app processes all Spotify data locally in your browser. We do not store your personal information, 
              liked songs, or playlists on our servers. Authentication uses Spotify's secure OAuth flow. 
              Tokens are stored only in your browser's local storage. We use anonymous analytics to improve the app.
            </p>
          </div>

          {/* Logout */}
          <Button
          onClick={async () => {
            songStorage.clear();
            songStorage.clearHistory();
            songStorage.clearPlaylists();
            await logout();
            toast.success('Logged out successfully');
            onOpenChange(false);
          }}
          variant="destructive"
          className="w-full bg-red-600 hover:bg-red-700 text-white">

            <LogOut size={18} className="mr-2" />
            Logout from Spotify
          </Button>
        </div>
      </DialogContent>
    </Dialog>);

}