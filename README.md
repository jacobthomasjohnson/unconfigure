# Unconfigure

**Unconfigure** is a bite-sized timeline puzzle.  
Each day you get a shuffled list of inventions, discoveries, or cultural moments—drag them into chronological order in as few guesses as possible.

- **Drag-and-drop gameplay** powered by [`@dnd-kit`](https://github.com/clauderic/dnd-kit).
- **Limited attempts & animated reveals** keep rounds fast and fun.
- **Locked-in correctness**: once an item is in the right spot it can’t be moved, trimming the mental load.
- **Daily challenge + share card** (à la Wordle) for friendly bragging rights.
- **Anon progress sync** via Supabase so you can pick up where you left off on any device.

| Stack | Why |
|-------|-----|
| Next.js (App Router) | File-based routing & server actions |
| Tailwind CSS | Rapid, utility-first styling |
| Zustand | Lightweight state management |
| Supabase | Postgres + Row Level Security for anonymous save data |
| Framer Motion | Smooth page & result transitions |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/yourhandle/unconfigure.git
cd unconfigure

# 2. Install deps
pnpm install   # or npm / yarn

# 3. Add your Supabase keys
cp .env.example .env.local   # fill in the blanks

# 4. Dev server
pnpm dev
