# Goldfizh Sales — Setup

## Vereisten
- Node.js 18+
- PostgreSQL database (lokaal of Supabase/Railway)
- Google Cloud Console project met OAuth 2.0
- Anthropic API key
- Tavily API key

## 1. Omgevingsvariabelen

Kopieer `.env.local` en vul de waarden in:

```bash
cp .env.local .env.local
```

```env
DATABASE_URL="postgresql://user:password@host:5432/goldfizh_sales"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<run: openssl rand -base64 32>"

GOOGLE_CLIENT_ID="<van Google Cloud Console>"
GOOGLE_CLIENT_SECRET="<van Google Cloud Console>"

ANTHROPIC_API_KEY="<van console.anthropic.com>"
TAVILY_API_KEY="<van tavily.com>"
```

### Google OAuth instellen
1. Ga naar [Google Cloud Console](https://console.cloud.google.com)
2. Maak een OAuth 2.0 client aan (Web application)
3. Voeg toe als Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Voor productie: voeg je Vercel domein toe

## 2. Database

Zet `DATABASE_URL` in `.env` (voor Prisma CLI) én in `.env.local` (voor de app).

```bash
# Maak de database tabellen aan
npx prisma migrate dev --name init

# Of bij een nieuwe deployment:
npx prisma migrate deploy
```

## 3. Development starten

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 4. Productie deployment (Vercel + Supabase)

### Database (Supabase)
1. Maak een project aan op [supabase.com](https://supabase.com)
2. Kopieer de `DATABASE_URL` (Transaction Pooler, poort 6543)
3. Voeg `?pgbouncer=true&connection_limit=1` toe aan de URL

### Vercel
1. Push code naar GitHub
2. Koppel repo aan Vercel
3. Stel environment variabelen in via Vercel dashboard
4. Na deployment: `npx prisma migrate deploy`

## Projectstructuur

```
src/
├── app/
│   ├── (app)/              # Beveiligde routes (auth vereist)
│   │   ├── layout.tsx      # App shell met navigatie
│   │   ├── dashboard/      # Dashboard pagina
│   │   ├── leads/          # Leads overzicht + nieuw formulier
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   └── [id]/       # Lead detail + status + notities
│   │   └── stats/          # Team statistieken
│   ├── api/
│   │   ├── auth/           # NextAuth endpoints
│   │   ├── leads/          # CRUD + status + notities
│   │   └── stats/          # Statistieken endpoint
│   ├── login/              # Login pagina
│   └── page.tsx            # Root redirect
├── components/
│   ├── nav.tsx             # Sidebar navigatie
│   └── status-badge.tsx    # Lead status pill
├── lib/
│   ├── auth.ts             # NextAuth configuratie
│   ├── db.ts               # Prisma client singleton
│   ├── ai-agent.ts         # AI verrijking (Claude + Tavily)
│   └── constants.ts        # Labels en kleuren
└── middleware.ts            # Auth guard
```
