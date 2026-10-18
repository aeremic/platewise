# Plan objave — Platewise 1.0 (App Store + Google Play)

Kod, konfiguracija, privacy policy, tekstovi i grafika su spremni na grani `release/store-prep`.
Ovo su koraci koje **ti** moraš da uradiš (nalozi, plaćanje, potpisivanje, slanje). Redosled je
bitan: Google Play ima obavezno testiranje od 14 dana, pa njega pokreni što pre.

Pomoćni fajlovi: `store/listing.md` (tekstovi), `store/forms.md` (odgovori za formulare),
`store/graphics/` (Play ikona + feature graphic), `docs/` (sajt i privacy policy).

---

## 0. Pre svega (≈ 30 min)

1. **Email za podršku.** Napravi posebnu adresu (npr. `platewise.app@gmail.com`).
   Zameni `replace-me@example.com` svuda:
   ```bash
   grep -rl "replace-me@example.com" src docs store | xargs sed -i '' 's/replace-me@example.com/TVOJA@ADRESA/g'
   ```
   Pa proveri: `npm run release:check` (mora da prođe bez grešaka).
2. **Spoji granu** `release/store-prep` u `main` (PR).
3. **GitHub Pages:** GitHub → aeremic/platewise → Settings → Pages → Source: *Deploy from a branch*,
   Branch: `main`, folder `/docs` → Save. Posle ~1 min proveri da rade:
   - https://aeremic.github.io/platewise/
   - https://aeremic.github.io/platewise/privacy.html
   Repo mora ostati public (ili plati GitHub Pro za Pages na privatnom repou).
4. **USDA ključ — bezbednost.** Stari APK-ovi koje si slao testerima sadrže tvoj lični USDA ključ.
   Na https://fdc.nal.usda.gov/api-key-signup napravi novi ključ (ili zatraži da se stari ugasi),
   prestani da deliš stare APK-ove. U EAS **ne postavljaj** `EXPO_PUBLIC_FDC_API_KEY` dok ne
   dobiješ zvanični ključ za aplikaciju — Look up je u 1.0 namerno isključen.
5. **Testeri sa starom verzijom:** nova aplikacija ima novi ID (`com.aeremic.platewise`), pa se
   instalira kao *druga* aplikacija. Neka u staroj urade Settings → Backup → Export, a u novoj Import.

## 1. Expo / EAS nalog (≈ 15 min, besplatno)

1. Napravi nalog na https://expo.dev (ako ga nemaš).
2. U projektu:
   ```bash
   npm install -g eas-cli
   eas login
   eas init
   ```
   `eas init` dodaje `extra.eas.projectId` (i eventualno `owner`) u `app.json` — commituj tu izmenu.
3. Besplatni EAS plan: do 15 Android i 15 iOS buildova mesečno, u sporijem redu (u gužvi build
   može da čeka i 90+ min). Za 1.0 je dovoljno.
4. Build brojeve vodi EAS (`appVersionSource: remote`). Prvi Android build će verovatno dobiti
   versionCode **2**, a iOS build broj **1** — oba su u redu.
5. **Pre svakog produkcijskog builda** proveri da u EAS-u nema USDA promenljivih (cloud build ih
   ugrađuje u aplikaciju, a `npm run release:check` vidi samo lokalne `.env` fajlove):
   ```bash
   eas env:list --environment production
   ```
   ```bash
   eas env:list --scope account
   ```
   Ni u jednoj listi ne sme biti `EXPO_PUBLIC_FDC_API_KEY` ni `EXPO_PUBLIC_USDA_LOOKUP`.

## 2. Google Play (pokreni odmah — traje najduže)

### 2.1 Nalog ($25 jednom; Google ne navodi koliko traje verifikacija)
1. https://play.google.com/console/signup → **Personal** nalog.
2. Plati $25, verifikuj identitet (lična karta/pasoš), telefon i email. Na Play-u se javno
   prikazuju tvoje **pravno ime, država i developer email**; adresa samo ako aplikacija zarađuje.
3. **Verifikacija uređaja:** na Play Console Home zadatak *Verify that you have access to an
   Android mobile device* — skeniraj QR kod pravim (ne-rootovanim) Android 10+ telefonom i potvrdi u
   aplikaciji Play Console. Bez toga aplikacija ne može da izađe.
4. Novi lični nalozi moraju da urade **closed testing: najmanje 12 testera prijavljenih 14 dana bez
   prekida**, pre nego što smeju da traže produkciju.

### 2.2 Aplikacija u konzoli
1. Create app → ime `Platewise: Food Diary`, English (US), App, Free.
2. Popuni *Store listing* iz `store/listing.md` + grafika iz `store/graphics/` + screenshotovi
   iz `store/screenshots/android/`.
3. Popuni sve u *Policy → App content* prema `store/forms.md` (privacy policy, ads, data safety,
   content rating, target audience 18+, health apps…).
4. **Settings → Catalog Settings** (novo od jula 2026): odluči da li se tvoj US store listing deli sa
   drugim US Android prodavnicama. Ako ništa ne izabereš, deli se. Za besplatnu aplikaciju je
   „publish to all” u redu; izaberi svesno.
5. **Android developer verification:** posle kreiranja aplikacije proveri na Play Console Home (ili
   stranici Android developer verification) da je `com.aeremic.platewise` registrovan. Nove
   aplikacije se registruju automatski, ali od 30. 9. 2026. neregistrovani paketi se uklanjaju.

### 2.3 Prvi build (AAB)
```bash
eas build --platform android --profile production
```
- Pri prvom buildu EAS pita da napravi **keystore** → Yes (čuva ga Expo).
- Napravi rezervnu kopiju: `eas credentials` → Android → *credentials.json: Upload/Download…* →
  *Download credentials from EAS to credentials.json*. To skida `.jks` **i lozinke** (keystore
  password, key alias, key password). Čuvaj ih **van repoa** (npr. u password manageru) — repo je
  javan; `credentials.json` i `credentials/` su zato u `.gitignore`. Uz Play App Signing ovo je samo
  „upload key”: ako ga izgubiš, Google može da ga resetuje.
- **Prvi AAB otpremi ručno** u Play Console (najjednostavnije, ne treba service account):
  Testing → Internal testing → Create release → upload `.aab` (link sa expo.dev). *Play App
  Signing* se uključuje sam pri prvom uploadu (najviše klikneš *Continue*).
- Posle uploada otvori **App bundle explorer** i proveri: target SDK 36, podrška za 16 KB stranice,
  a od dozvola samo `INTERNET` i `VIBRATE` (bez INSTALL_REFERRER i AD_ID).

### 2.4 Closed testing (14 dana)
1. Testing → Closed testing → Create track → dodaj email listu sa **12+ testera** (Google nalozi);
   bolje ~15, kao rezervu.
2. Napravi release sa istim AAB-om, pošalji na review (obično par sati do 2 dana).
3. Pošalji testerima opt-in link. Uslov je da **najmanje 12 testera ostane prijavljeno 14 dana bez
   prekida** — ako se neko odjavi, njegov brojač kreće ispočetka. Zamoli ih i da aplikaciju
   instaliraju i stvarno koriste: formular za produkciju pita da li su probali sve funkcije.
4. Posle 14 dana: Dashboard → *Apply for production* (pitaju šta su testeri rekli i šta si popravio).

### 2.5 Produkcija
1. Posle odobrenja: Production → Create release → izaberi isti build → release notes iz
   `store/listing.md` → *Start rollout*. Novi nalozi imaju produženi review — računaj na
   **do 7 dana, ponekad i duže**; ne šalji nove izmene dok review traje (vraćaju te u red).
2. Sledeće verzije možeš da šalješ iz terminala: `eas build -p android --profile production` pa
   `eas submit -p android` (ide na internal kao draft, vidi `eas.json`). Za to jednom podesi
   **Google service account** (vodič: https://github.com/expo/fyi/blob/main/creating-google-service-account.md):
   1. Google Cloud → novi projekat → Service account → napravi JSON ključ.
   2. U tom projektu uključi *Google Play Android Developer API*.
   3. Play Console → *Users and permissions* → pozovi email service accounta sa dozvolama za
      izdavanje (release na testing/production trake, upravljanje trakama, store presence).
   4. `eas credentials --platform android` → *Google Service Account* → otpremi JSON.
   JSON ključ čuvaj **van repoa** (Google mu daje ime po projektu, pa ga `.gitignore` ne prepoznaje
   osim ako ga ne preimenuješ u npr. `play-service-account.json`).

## 3. Apple App Store

### 3.1 Nalog ($99 godišnje)
1. https://developer.apple.com/programs/enroll → kao **Individual**. Treba: Apple nalog sa 2FA,
   **pravo ime i prezime** na tom nalogu (nadimak usporava odobrenje), punoletstvo i adresa
   (ne poštanski fah). Cena može biti prikazana u lokalnoj valuti.
2. Kao Individual, „Seller” na App Store-u je tvoje pravno ime i **ne može se kasnije menjati**.

### 3.2 App Store Connect
1. My Apps → **+ New App**: iOS, ime `Platewise`, English (U.S.), Bundle ID
   `com.aeremic.platewise`, SKU `platewise-ios`. Ako Bundle ID nije u listi: pokreni prvo
   `eas build -p ios` (pri podešavanju sertifikata registruje App ID) ili ga ručno dodaj na
   developer.apple.com → Certificates, IDs & Profiles → Identifiers.
2. Posle kreiranja upiši Apple ID aplikacije (App Information → *Apple ID*, broj) u `eas.json`
   kao `submit.production.ios.ascAppId` — tada `eas submit` ne pokušava da pravi novu aplikaciju.
3. Popuni sve po `store/forms.md`: App Information, **Regulated Medical Device: No** (obavezno za
   Health & Fitness), **Digital Services Act: nisi trader**, App Privacy (*Data Not Collected*),
   Age Rating (**odluči o alkoholu — preporuka 13+**), Pricing (Free, bez Kine).
4. Verzija 1.0: tekstovi iz `store/listing.md`, screenshotovi 6.9" iz `store/screenshots/ios/`,
   Support URL i Privacy URL, Review notes iz `store/forms.md`, copyright `2026 Andrija Eremić`.

### 3.3 Build i TestFlight
```bash
eas build --platform ios --profile production
eas submit --platform ios
```
- EAS te uloguje u Apple nalog, sam napravi sertifikat i provisioning profile.
- Posle ~15–30 min build je u TestFlight-u. Da bi ga instalirao na svoj iPhone: App Store Connect →
  TestFlight → napravi *Internal Testing* grupu i dodaj sebe (ili `eas submit -p ios --groups …`),
  pa na telefonu instaliraj aplikaciju **TestFlight**. Prođi glavni tok (dodaj hranu, dan, ciljevi,
  bekap, About, Ask AI otvara Safari).
- Opciono: TestFlight interni testeri (do 100) bez review-a.

### 3.4 Slanje na review
App Store Connect → verzija 1.0 → izaberi build → **Add for Review** → Submit. Apple pregleda
polovinu aplikacija za manje od 24 h, a 90% za manje od 48 h. Ako odbiju, odgovor stiže u
Resolution Center — pošalji mi tekst.

## 4. Screenshotovi (gotovi)

Napravljeni su iz release buildova sa demo podacima:

- iOS 6.9" (1320×2868, iPhone 17 Pro Max): `store/screenshots/ios/01…05` — Apple ostale veličine
  izvodi sam. Aplikacija je samo za iPhone (`supportsTablet: false`), pa iPad slike nisu potrebne.
- Android (1080×1920, 9:16 — ispunjava i uslov za Google-ove preporuke): `store/screenshots/android/01…05`.
- Sve slike su bez alpha kanala (obe prodavnice odbijaju providnost); nove pripremi sa
  `swift scripts/store-image.swift <ulaz> <izlaz> [ŠIRINAxVISINA]`.

Redosled: 1 kalendar, 2 dodavanje hrane sa živim pregledom, 3 „zašto je dan crven”,
4 kategorije, 5 editor kategorije. Ako želiš nove (npr. posle izmene dizajna):
`node scripts/make-demo-backup.mts <danas> > demo.json`, pa Settings → Backup → Import na
svežem simulatoru/emulatoru (detalji u AGENTS.md → Release).

## 4a. Zakoni o proveri uzrasta u SAD (proceni)

Texas (od 4. 6. 2026), Utah i Louisiana uvode proveru uzrasta u prodavnicama. Apple navodi da u
tim regionima aplikacije treba da koriste *Declared Age Range* API, a Google prepušta svakom
developeru da proceni da li ga se zakon tiče. Za besplatnu aplikaciju bez naloga i bez
prikupljanja podataka to verovatno ne važi, ali zvanično nije potvrđeno. Ako želiš sigurnost,
pitaj pravnika ili Apple podršku pre objave; za sada ništa ne menjamo u aplikaciji.

## 5. Posle objave

- Odgovaraj na email podrške i recenzije.
- Nova verzija: povećaj `expo.version` u `app.json` (npr. 1.0.1); build brojeve EAS sam povećava.
- Pre svakog builda: `npm run typecheck && npm run lint && npm test && npm run release:check`.
- Apple članarina se obnavlja godišnje — ako istekne, aplikacija nestaje iz App Store-a.

## Rokovi (okvirno)

| Dan | Šta |
|---|---|
| 1 | Email, Pages, Expo, prijava na Play i Apple |
| 2–3 | Verifikacije gotove; Play: prvi AAB + closed testing; Apple: TestFlight |
| 3–5 | Apple review (obično < 48 h) → **App Store objava** |
| 17+ | 14 dana testiranja → zahtev za produkciju (i on ide na pregled) |
| ~25–30 | Produkcijski review (novi nalozi do 7+ dana) → **Google Play objava** |
