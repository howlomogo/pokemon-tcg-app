const typeColorClasses: Record<string, string> = {
  grass: 'border-emerald-700/60 bg-emerald-950/50',
  fire: 'border-red-700/60 bg-red-950/50',
  water: 'border-blue-700/60 bg-blue-950/50',
  lightning: 'border-yellow-700/60 bg-yellow-950/50',
  psychic: 'border-purple-700/60 bg-purple-950/50',
  fighting: 'border-orange-700/60 bg-orange-950/50',
  darkness: 'border-slate-600/60 bg-slate-900/70',
  metal: 'border-zinc-500/60 bg-zinc-800/50',
  dragon: 'border-amber-700/60 bg-amber-950/50',
  fairy: 'border-pink-700/60 bg-pink-950/50',
  colorless: 'border-neutral-700 bg-neutral-900',
};

export function getTypeColorClass(type?: string) {
  return type
    ? typeColorClasses[type.toLocaleLowerCase()] ?? 'border-neutral-800 bg-neutral-900'
    : 'border-neutral-800 bg-neutral-900';
}
