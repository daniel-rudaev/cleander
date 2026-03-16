import React from 'react';
import { ArrowUpDown, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'@/components/ui/select';

export default function ReviewFilterSort({ sortOrder, onSortOrderChange, actionFilter, onActionFilterChange }) {
  return (
    <div className="px-4 py-3 flex gap-2 items-center border-b border-zinc-800/50">
      {/* Sort */}
      <div className="flex items-center gap-1.5 flex-1">
        <ArrowUpDown size={13} className="text-zinc-500 flex-shrink-0" />
        <Select value={sortOrder} onValueChange={onSortOrderChange}>
          <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-300 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
            <SelectItem value="reviewed-desc" className="text-white text-xs focus:bg-zinc-700 focus:text-white">Reviewed — Newest first</SelectItem>
            <SelectItem value="reviewed-asc" className="text-white text-xs focus:bg-zinc-700 focus:text-white">Reviewed — Oldest first</SelectItem>
            <SelectItem value="title-asc" className="text-white text-xs focus:bg-zinc-700 focus:text-white">Title — A → Z</SelectItem>
            <SelectItem value="artist-asc" className="text-white text-xs focus:bg-zinc-700 focus:text-white">Artist — A → Z</SelectItem>
            <SelectItem value="liked-desc" className="text-white text-xs focus:bg-zinc-700 focus:text-white">Date liked — Newest</SelectItem>
            <SelectItem value="liked-asc" className="text-white text-xs focus:bg-zinc-700 focus:text-white">Date liked — Oldest</SelectItem>
            <SelectItem value="popularity-desc" className="text-white text-xs focus:bg-zinc-700 focus:text-white">Popularity — High → Low</SelectItem>
            <SelectItem value="release-desc" className="text-white text-xs focus:bg-zinc-700 focus:text-white">Release — Newest first</SelectItem>
            <SelectItem value="release-asc" className="text-white text-xs focus:bg-zinc-700 focus:text-white">Release — Oldest first</SelectItem>
            <SelectItem value="duration-asc" className="text-white text-xs focus:bg-zinc-700 focus:text-white">Duration — Shortest</SelectItem>
            <SelectItem value="decision-asc" className="text-white text-xs focus:bg-zinc-700 focus:text-white">Decision time — Fastest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Action filter */}
      <div className="flex items-center gap-1.5 flex-1">
        <Filter size={13} className="text-zinc-500 flex-shrink-0" />
        <Select value={actionFilter} onValueChange={onActionFilterChange}>
          <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-300 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
            <SelectItem value="all" className="text-white text-xs focus:bg-zinc-700 focus:text-white">All actions</SelectItem>
            <SelectItem value="kept" className="text-white text-xs focus:bg-zinc-700 focus:text-white">Kept only</SelectItem>
            <SelectItem value="removed" className="text-white text-xs focus:bg-zinc-700 focus:text-white">Removed only</SelectItem>
            <SelectItem value="saved" className="text-white text-xs focus:bg-zinc-700 focus:text-white">Starred only</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>);

}