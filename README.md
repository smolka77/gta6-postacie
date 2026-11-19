# GTA 6 gierka – postać, stroje i kreator głów

Postać do przeglądarkowej strzelanki TPP/FPP w klimacie GTA (three.js 0.170): model z kośćmi, proceduralne animacje,
13 strojów nawiązujących do znanych postaci i kreator, w którym samemu projektuje się skóry głowy.

## Co jest w repozytorium

| Plik | Co to jest |
|---|---|
| `index.html` | prototyp postaci: rig, proceduralne animacje (chód, bieg, kucanie, skok, celowanie, strzał), kamery FPP/TPP, przełączanie strojów i głów |
| `character.glb` | model postaci z kośćmi |
| `game/outfits.js` | stroje: ubrania jako osobna geometria nałożona na ciało + shader detali (szwy, guziki, kieszenie, wzory, napisy) |
| `game/head.js` | głowa-płótno (gładka czaszka bez twarzy) i jej mapowanie tekstury, wspólne dla gry i kreatora |
| `kreator-glowy.html` | kreator skór głowy: malowanie na 3D i na rozłożonej teksturze, symetria, nanoszenie zdjęć, zapis do gry |
| `server.ps1`, `start.bat` | lokalny serwer (bez instalowania czegokolwiek) + API zapisu głów do `skins/heads/` |
| `skins/heads/` | zapisane skóry głowy (`*.png`) i ich lista `index.json` |

## Uruchomienie (Windows)

1. Dwuklik `start.bat` – uruchamia serwer na http://localhost:8090/ (okno konsoli musi zostać otwarte).
2. Kreator głów: http://localhost:8090/kreator-glowy.html
3. Gra: http://localhost:8090/ – **uwaga:** `index.html` importuje też mapę (`map/`), fizykę ruchu (`game/physics.js`) i bronie
   (`game/weapons.js`, `weapons/`), których nie ma w tym repozytorium. Kreator głów działa bez nich.

Sterowanie w grze: `K` / `L` strój, `J` głowa, `V` kamera, `W A S D` ruch, `F` broń, mysz – rozglądanie i strzał.

## Stroje

Michael De Santa, Trevor Philips, Franklin Clinton, CJ, Big Smoke, Lester Crest, Niko Bellic, Tommy Vercetti,
Lucia Caminos, Jason Duval, Elon Musk, Donald Trump, żaba Pepe. Własne, proceduralne odwzorowania stylu ubioru –
bez żadnych assetów z gier Rockstar. Nowy strój to jeden wpis w tablicy `OUTFITS` w `game/outfits.js`
(opis wszystkich pól jest na początku pliku).

## Kreator głów

- lewy przycisk – malowanie (na głowie 3D albo na rozłożonej teksturze), prawy / poza głową – obracanie, kółko – zoom
- `B` pędzel, `E` gumka, `I` / `Alt` + klik pipeta, `[` `]` rozmiar, `M` symetria, `Ctrl+Z` / `Ctrl+Y`
- zdjęcie lub obrazek: „Wczytaj obrazek…” albo `Ctrl+V`, ustaw na twarzy (przeciągnij, kółko = rozmiar,
  `Shift` + kółko = obrót) i „Nanieś na głowę”
- „Zapisz w grze” zapisuje głowę; przypisana do stroju pojawia się w grze automatycznie z tym strojem

## Licencja modelu

Model postaci: „Dress To Impress Man Base (With Bones)” – zHairezt, Sketchfab, licencja CC-BY-4.0.
