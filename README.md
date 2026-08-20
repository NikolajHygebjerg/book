# Begejstring — Bookingsystem

Bookingsystem til keramikværkstedet Begejstring. Erstatter Amelia WordPress-plugin med en dedikeret løsning med kapacitetsstyring, abonnementer og step-by-step booking.

## Funktioner

- **Step-by-step booking** — vælg timer, personer, dato/tid, drejeskive-tilvalg
- **Live kapacitetsvisning** — se hvor mange der er i værkstedet (max 10)
- **Abonnementer** — Basis (5 t/uge), Plus (15 t/uge), Ubegrænset
- **Stripe betaling** — engangsbetaling og månedlige abonnementer (kort + MobilePay)
- **Brugerside** — profil, bookinghistorik, abonnementsstyring, slet konto
- **PWA** — kan gemmes som webapp på telefon med persistent login

## Tech stack

- Next.js 16 (App Router)
- PostgreSQL + Prisma
- NextAuth v5 (credentials)
- Stripe Checkout + Subscriptions
- Tailwind CSS

## Kom i gang

### 1. Installer dependencies

```bash
npm install
```

### 2. Konfigurer miljøvariabler

```bash
cp .env.example .env
```

Udfyld værdierne i `.env`.

### 3. Database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Stripe opsætning

1. Opret konto på [stripe.com](https://stripe.com)
2. Opret tre produkter/abonnementer i Stripe Dashboard:
   - Basis: 299 kr/måned
   - Plus: 599 kr/måned
   - Ubegrænset: 999 kr/måned
3. Kopiér Price IDs til `.env`
4. Opsæt webhook endpoint: `https://book.begejstring.dk/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### 5. Start udviklingsserver

```bash
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000).

## Deployment

Se **[DEPLOYMENT.md](./DEPLOYMENT.md)** for opsætning af automatisk deploy til `book.begejstring.dk` ved hver push til `main`.

## Priser (placeholder — kan ændres i `src/lib/config.ts`)

| | Pris |
|---|---|
| Timepris | 30 kr |
| Drejeskive | 50 kr/time ekstra |
| Basis abonnement | 299 kr/md (5 t/uge) |
| Plus abonnement | 599 kr/md (15 t/uge) |
| Ubegrænset | 999 kr/md |

## Projektstruktur

```
src/
├── app/                  # Sider og API routes
│   ├── api/
│   │   ├── auth/         # Login, register
│   │   ├── bookings/     # Opret + kapacitet
│   │   ├── subscriptions/
│   │   ├── stripe/webhook/
│   │   └── user/
│   ├── book/             # Booking wizard
│   ├── min-side/         # Brugerdashboard
│   └── ...
├── components/
│   ├── booking/          # BookingWizard
│   ├── subscription/
│   └── user/
└── lib/
    ├── auth.ts
    ├── capacity.ts       # Kapacitetslogik
    ├── config.ts         # Priser og indstillinger
    ├── pricing.ts
    └── subscription.ts
```

## Kapacitetslogik

Værkstedet har plads til **10 personer** ad gangen. For hver time i en booking tælles antallet af personer fra alle overlappende, bekræftede bookinger. En booking afvises hvis nogen time i perioden ville overstige kapaciteten.

## Licens

Privat — Begejstring / Ideværket
# book
