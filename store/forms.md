# Odgovori za formulare — Platewise 1.0

Šta tačno da izabereš/upišeš u App Store Connect i Google Play Console. Vrednosti koje se
kopiraju su na engleskom. Svi odgovori se zasnivaju na tome kako aplikacija radi u verziji 1.0:
sve je lokalno, nema naloga, reklama, analitike ni crash reportinga, aplikacija sama ne otvara
internet (Ask AI i linkovi idu u browser telefona), a **USDA Look up je isključen**.
Provereno prema zvaničnoj dokumentaciji Apple-a i Google-a, oktobar 2026.

> Ako kasnije uključiš USDA Look up (nazivi hrane idu na USDA server), dodaj to u
> `docs/privacy.html` i proveri ove odgovore ponovo.

---

## Apple — App Store Connect

### App Information
| Polje | Vrednost |
|---|---|
| Name | Platewise |
| Subtitle | Food diary, colored by day |
| Bundle ID | com.aeremic.platewise |
| SKU | platewise-ios (bilo šta jedinstveno, ne vidi se javno) |
| Primary language | English (U.S.) |
| Primary category | Health & Fitness |
| Secondary category | Food & Drink |
| Content rights | **No**, the app doesn't contain, show, or access third-party content |

### App Store Regulations & Permits (App Information)
- **Regulated Medical Device → No → Save.** Obavezno od marta 2026. za nove aplikacije u kategoriji
  Health & Fitness koje se distribuiraju u EU/EEA, UK ili SAD (radi Account Holder/Admin).
- **Digital Services Act** — vidi „EU Digital Services Act” ispod.
- Ako se pojavi upitnik *Digital Goods and Services*: aplikacija nema digitalnu robu ni kupovine.
  Ako se ne pojavi, ne treba ništa.

### App Privacy
- Privacy Policy URL: `https://aeremic.github.io/platewise/privacy.html`
- „Do you or your third-party partners collect data from this app?” → **No, we do not collect data from this app**
  → kartica pokazuje **Data Not Collected**.
- Zašto je to tačno: dnevnik je samo u SQLite bazi na telefonu; bekap fajl korisnik sam deli
  (share sheet); Ask AI i linkovi samo otvaraju Safari — aplikacija ništa ne šalje niti čita.

### Age Rating (upitnik)
Upitnik ima nekoliko koraka; odgovori redom:

1. **In-App Controls:** Parental Controls i Age Assurance — ništa ne označavaj.
2. **Capabilities:** Unrestricted Web Access, User-Generated Content, Social Media, Messaging and
   Chat, Advertising — **ništa ne označavaj**. Aplikacija ne prikazuje web stranice (Ask AI, privacy
   i help se otvaraju u Safariju), nema korisnički sadržaj koji drugi vide, ni reklame.
3. **Medical or Wellness:**
   - Medical or Treatment-Focused Content: **None** (ne daje medicinske savete; disclaimer je u
     Settings → About i u opisu).
   - **Health or Wellness Topics: Yes** — Apple u definiciji navodi „calorie tracking”. Ovo samo po
     sebi daje **9+**.
4. **Alcohol, Tobacco, or Drug Use or References:** među ugrađenim kategorijama postoji „Alcohol”
   🍺 („1 drink”, označen kao nezdrav). Apple broji i obične *reference* na konzumiranje alkohola,
   bez obzira na promociju, a pravilo 2.3.6 traži iskrene odgovore.
   **Preporuka: Infrequent** → rejting **13+**. (Frequent bi bio 18+.)
   Odluči pre prve objave: kasnija promena rejtinga se u Teksasu računa kao „značajna promena” i
   traži saglasnost roditelja za maloletne korisnike. Alternativa je da se ugrađena kategorija
   preimenuje ili ukloni (javi ako to želiš — to je izmena aplikacije, ne samo formulara).
5. Sve ostalo (nasilje, seksualni sadržaj, jezik, horor, kockanje, nagradne igre…): **None / No**.

Očekivani rezultat: **13+** (ili 9+ ako alkohol ostane None). Prihvati ono što forma izračuna.

### App Review Information
- Sign-in required: **No**
- Contact: ime, email i telefon **u međunarodnom formatu** (`+381…`; samo cifre se više ne prihvataju).
  Vidi ih samo Apple.
- Notes (kopiraj):

```
Platewise is a private food diary. No account or sign-in is needed and all data stays on the device (SQLite); the app has no server, analytics, ads or tracking.

How to try it:
1. Tap "Add food", pick a few foods (e.g. Salad, Pizza), optionally change portions, tap Save.
2. The calendar day gets a color (green / orange / red). Tap the day to see why it got that color.
3. Settings → Daily goals sets calorie / fiber / sugar goals that adjust the color.
4. Settings → Backup exports or imports a JSON file (Files app / AirDrop).
5. Settings → About has the "not medical advice" disclaimer, privacy policy and support links.

"Ask AI" in the category editor opens a Google search in Safari to help the user look up nutrition values; the app does not read anything back. The app does not display web content itself.

Nutrition values and day colors are general estimates for everyday awareness, not medical advice.
```

### Export Compliance
Već rešeno u `app.json` (`ITSAppUsesNonExemptEncryption = false`) — App Store Connect neće pitati.

### Accessibility (Accessibility Nutrition Labels, opciono)
Označi samo ono što je provereno: **Dark Interface** (aplikacija je uvek tamna). VoiceOver i
Larger Text ne označavaj dok ne prođeš celu aplikaciju sa njima na pravom telefonu.

### EU Digital Services Act (Trader status)
Obavezno za svaku aplikaciju (i kad nije u EU); bez toga se ne prikazuje u EU App Store-u.
- Nivo naloga: **Business → Agreements → Compliance → Digital Services Act → Complete Compliance
  Requirements**.
- Nivo aplikacije: **App Information → App Store Regulations & Permits → Digital Services Act**.
- Izaberi da **nisi trader**. To je tvoja pravna procena: fizičko lice, besplatna aplikacija bez
  reklama, kupovina i firme se obično ne smatra traderom. EU korisnicima se tada prikazuje da
  potrošačka prava prema trgovcu ne važe.

### Pricing and Availability
- **Pricing and Availability → Price Schedule → Add Pricing** → osnovna zemlja → **Free (0.00)**
  (cenovni „tier”-ovi više ne postoje).
- Dostupnost: sve zemlje osim **Kine (China mainland)** — tamo treba MIIT ICP broj, bez njega
  aplikacija stoji kao „ICP Filing Number Missing”. Najjednostavnije: isključi China mainland.

---

## Google — Play Console

### Store settings
| Polje | Vrednost |
|---|---|
| App name | Platewise: Food Diary |
| Default language | English (United States) – en-US |
| App or game | App |
| Free or paid | Free (posle objave se ne može promeniti u Paid) |
| Category | Health & Fitness |
| Tags | do 5 iz Google-ove liste (Store settings → App category → Manage tags); biraj one koji opisuju dnevnik ishrane / kalorije |
| Contact email | adresa za podršku (javno se prikazuje) |
| Website | `https://aeremic.github.io/platewise/` |

### App content (Policy → App content)
| Deklaracija | Odgovor |
|---|---|
| Privacy policy | `https://aeremic.github.io/platewise/privacy.html` |
| Ads | **No**, my app does not contain ads |
| App access | **All functionality is available without special access** |
| Content rating | vidi ispod |
| Target audience | **samo 18 and over**. Ne biraj nijednu mlađu grupu: i 13–15 i 16–17 se u nekim zemljama računaju kao deca, pa bi važila Families pravila. Opciono polje *Restrict Minor Access* ostavi neoznačeno. |
| News app | No |
| Data safety | vidi ispod |
| Government app | No |
| Financial features | My app doesn't provide any financial features |
| Health apps | vidi ispod |
| Advertising ID | No (aplikacija ga ne koristi) |

### Data safety
- „Does your app collect or share any of the required user data types?” → **No**
- (Pitanja o enkripciji i brisanju se tada preskaču.)
- Na kraju forme Play pokazuje: *No data collected · No data shared*.
- Zašto je tačno: aplikacija ništa ne šalje sa telefona. Ask AI predaje naziv hrane browseru, a
  bekap korisnik sam deli/čuva — Google takav prenos *drugoj aplikaciji na telefonu* inače računa
  kao „sharing”, ali je izuzet jer ga korisnik sam pokreće i očekuje. Ako Ask AI ikad počne da radi
  bez dodira ili u ugrađenom prozoru, ovo treba ponovo proceniti.
- Dozvole u buildu: `INTERNET` (standardna za React Native; aplikacija sama ništa ne učitava) i
  `VIBRATE` (haptika). Storage dozvole, overlay i Play Install Referrer (dolazi iz
  `expo-application`, ne koristi se) su uklonjeni preko `android.blockedPermissions` u `app.json`.
  Posle prvog uploada proveri listu u **App bundle explorer**.

### Content rating (IARC upitnik)
- Email: tvoja adresa (za IARC prepisku).
- Kategoriju i pitanja čitaj iz žive forme (Google ih ne objavljuje unapred); očekivano je
  kategorija za aplikacije koje nisu igre (npr. *All Other App Types*).
- Nasilje, seks, jezik, kockanje, komunikacija između korisnika, deljenje lokacije, kupovine → **No**.
- Alkohol: ako pitanje pita za bilo kakve **reference** na alkohol, odgovori **Yes** (ugrađena
  kategorija „Alcohol”), isto kao kod Apple-a. Prihvati rejting koji IARC izračuna.
- Web browser / neograničen internet: **No** — aplikacija ne prikazuje web stranice; Ask AI i
  linkovi otvaraju podrazumevani browser (ili Google aplikaciju) van Platewise-a.

### Health apps declaration
- Obavezna za svaku aplikaciju (i za testing trake).
- U grupi **Health and fitness** označi **Nutrition and Weight Management**.
- **Ne** označavaj *Medical Device Apps* niti bilo šta iz grupe Medical. Ne koristi Health Connect.
- Google traži disclaimer u opisu — dodat je u Play i App Store opis (`store/listing.md`):
  „not a medical device and does not diagnose, treat, cure or prevent any medical condition …
  consult a healthcare professional”.

### Grafika
Sve slike su neprozirni PNG (bez alpha kanala), kako obe prodavnice traže
(`swift scripts/store-image.swift` ih priprema).
| Stavka | Fajl |
|---|---|
| App icon 512×512 | `store/graphics/play-icon-512.png` (ikona sme da ima alpha) |
| Feature graphic 1024×500 | `store/graphics/play-feature-graphic.png` |
| Phone screenshots (2–8) | `store/screenshots/android/` — 1080×1920 (9:16, ispunjava i uslov za Google-ove preporuke/promocije: min. 4 slike 9:16) |

---

## Obe prodavnice — kratko

- Nema login-a, nema demo naloga.
- Nema in-app kupovina ni pretplata.
- Podaci se ne prikupljaju; privacy policy je javna stranica na GitHub Pages.
- Disclaimer „not medical advice / not a medical device” postoji u aplikaciji, opisu i privacy policy-ju.
