import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';

export default function SpotifyAuth() {
  const { login } = useAuth();

  return (
    <Button
    onClick={login}
    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20">

      <Sparkles size={18} className="mr-2" />
      Connect Spotify
    </Button>);

}