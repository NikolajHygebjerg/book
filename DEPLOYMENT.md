# Automatisk deployment til book.begejstring.dk

Hver gang der pushes til `main` på GitHub, deployes appen automatisk til subdomænet.

```
Kodeændring → git push → GitHub Actions → Vercel → book.begejstring.dk
```

## Engangs-opsætning (ca. 15 min)

### 1. Opret GitHub-repo

```bash
cd /Users/nikolajhygebjerg/Begejstring
git init -b main
git add .
git commit -m "Initial commit: Begejstring bookingsystem"
gh repo create begejstring --private --source=. --push
```

(Eller opret repo manuelt på github.com og `git remote add origin ...`)

### 2. Opret Vercel-projekt

1. Gå til [vercel.com](https://vercel.com) og log ind med GitHub
2. **Add New → Project** → vælg `begejstring`-repoet
3. Framework: **Next.js** (auto-detekteret)
4. Tilføj miljøvariabler (Settings → Environment Variables):

| Variabel | Beskrivelse |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (fx fra [Neon](https://neon.tech)) |
| `NEXTAUTH_URL` | `https://book.begejstring.dk` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Fra Stripe webhook (se trin 5) |
| `STRIPE_PRICE_BASIS` | Stripe Price ID |
| `STRIPE_PRICE_PLUS` | Stripe Price ID |
| `STRIPE_PRICE_UNLIMITED` | Stripe Price ID |

5. Kør database migration én gang:
   ```bash
   DATABASE_URL="din-prod-url" npx prisma migrate deploy
   ```

### 3. Tilføj subdomæne i Vercel

1. Vercel → Project → **Settings → Domains**
2. Tilføj: `book.begejstring.dk`
3. Vercel viser DNS-instruktioner

### 4. DNS hos domæneudbyder

Tilføj hos den der administrerer `begejstring.dk`:

```
Type:  CNAME
Navn:  book
Værdi: cname.vercel-dns.com
```

Vent 5–30 min på DNS-propagering. Vercel udsteder automatisk SSL.

### 5. Stripe webhook (produktion)

1. Stripe Dashboard → **Webhooks → Add endpoint**
2. URL: `https://book.begejstring.dk/api/stripe/webhook`
3. Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Kopiér signing secret til `STRIPE_WEBHOOK_SECRET` i Vercel

### 6. GitHub Actions secrets (til workflow)

Gå til GitHub → repo → **Settings → Secrets and variables → Actions**

Hent værdierne fra Vercel (Settings → General):

| Secret | Hvor finder du det |
|--------|-------------------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create Token |
| `VERCEL_ORG_ID` | Vercel → Team Settings → General |
| `VERCEL_PROJECT_ID` | Vercel → Project Settings → General |

---

## Daglig brug

Efter opsætning sker deployment automatisk:

```bash
git add .
git commit -m "Beskrivelse af ændring"
git push
```

GitHub Actions kører build og deployer til `book.begejstring.dk` inden for 2–3 min.

Se status under **Actions**-fanen på GitHub.

### Alternativ: Vercel Git-integration (endnu simplere)

Hvis du forbinder GitHub direkte i Vercel (trin 2), deployer Vercel **automatisk ved push** uden GitHub Actions. Workflow-filen er en ekstra sikkerhed med eksplicit build-kontrol — begge kan bruges, men du behøver kun én af dem.

---

## Link fra begejstring.dk

Tilføj et link på WordPress-siden:

```html
<a href="https://book.begejstring.dk">Book værkstedstid</a>
```

Eller redirect `/book` subpath via WordPress redirect-plugin.
