const typeColorClasses: Record<string, string> = {
  grass: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  fire: 'border-red-300 bg-red-50 text-red-800',
  water: 'border-blue-300 bg-blue-50 text-blue-800',
  lightning: 'border-yellow-300 bg-yellow-50 text-yellow-800',
  psychic: 'border-purple-300 bg-purple-50 text-purple-800',
  fighting: 'border-orange-300 bg-orange-50 text-orange-800',
  darkness: 'border-slate-300 bg-slate-100 text-slate-800',
  metal: 'border-zinc-300 bg-zinc-100 text-zinc-800',
  dragon: 'border-amber-700/60 bg-amber-950/50',
  fairy: 'border-pink-300 bg-pink-50 text-pink-800',
  colorless: 'border-neutral-700 bg-neutral-900',
};

export function getTypeColorClass(type?: string) {
  return type
    ? typeColorClasses[type.toLocaleLowerCase()] ?? 'border-neutral-800 bg-neutral-900'
    : 'border-neutral-800 bg-neutral-900';
}
