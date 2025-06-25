# Unconfigure

**Unconfigure** is a bite-sized timeline puzzle.
Each day you get a shuffled list of inventions, discoveries, or cultural moments. Drag them into chronological order in as few guesses as possible.

- **Drag-and-drop gameplay** powered by [`@dnd-kit`](https://github.com/clauderic/dnd-kit).
- **Limited attempts & animated reveals** keep rounds fast and fun.
- **Locked-in correctness**: once an item is in the right spot it can’t be moved, trimming the mental load.
- **Daily challenge + share card** (à la Wordle) for friendly bragging rights.
- **Anon progress sync** via Supabase so you can pick up where you left off.

| Stack | Why |
|-------|-----|
| Next.js (App Router) | File-based routing & server actions |
| Tailwind CSS | Rapid, utility-first styling |
| Zustand | Lightweight state management |
| Supabase | Postgres + Row Level Security for anonymous save data |
| Framer Motion | Smooth page & result transitions |
| react-confetti | Fun times when correct order has been locked in! |

## Quick Start

# 1. Clone
```bash
git clone https://github.com/yourhandle/unconfigure.git
cd unconfigure
```

# 2. Install dependencies
```bash
npm install
```

# 3. Add your own Supabase keys
```bash
cp .env.example .env.local   # fill in the blanks
```

# 4. Spin up the dev server
```bash
npm run dev
```

# 5. Run it!
Open http://localhost:3000

## Roadmap
Add docs for backend integrations and customization.
