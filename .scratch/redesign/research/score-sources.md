# Score sources: samples, render tools, benchmarks, NASA audio, SFX

Researched 2026-10-04. Licence rule applied: free only; CC0 or self-made preferred; CC-BY / CC-BY-SA allowed with a credits line; NC, or "no standalone redistribution", is OUT.
Every licence line below is quoted from the page linked next to it. **(unverified)** marks anything I could not confirm on a primary page. I did not listen to any audio. Every "sounds like" line comes from the page's own description or tags.

---

## 1. Recorded-instrument sample libraries

### Verdict at a glance

| Need | Best CC0 pick | CC-BY fallback |
|---|---|---|
| Warm string pads / sustains | **VSCO 2 CE** string sections (violin, viola and cello sections, `susvib`). **Karoryfer String Cyborgs** for organic drone/pad synth patches made from bowed-string loops. **Karoryfer x bigcat cello** for a close, non-vibrato solo cello sustain | none needed |
| Felt / soft piano | **Osiris Piano** (Karoryfer x Versilian, "a quiet piano"). No true CC0 *felt* piano found | Salamander Grand (CC-BY 3.0) is a bright concert grand, not soft |
| Harp | **VSCO 2 CE / VCSL Concert Harp** (same KS Harp samples) | **Etherealwinds Harp II CE** (lever harp, CC-BY 4.0) |
| Celesta | **stamperadam "Celeste Samples"** Freesound pack (CC0, Neumann KM-184 pair, soft/hard layers). Neither VSCO 2 CE nor VCSL has a celesta | none |
| Glockenspiel | **VSCO 2 CE** `Percussion/Glock`, **VCSL** Glockenspiel | none |

### Library by library

| Library | Licence (quoted) | What's in it | Size / format | Verdict |
|---|---|---|---|---|
| **VSCO 2: Community Edition** (Versilian Studios). [page](https://versilian-studios.com/vsco-community/), [GitHub](https://github.com/sgossner/VSCO-2-CE) | "The library is under a Creative Commons 0 (i.e. public domain) license." The repo's LICENSE file is "CC0 1.0 Universal". The Readme adds a *request*, which is not a licence term: "We ask that you do not sell the samples directly … Please provide credit to Versilian Studios/Sam Gossner…" | **Strings:** Violin Section (susVib, Trem, Pizz, Spic), Viola Section (susvib, trem, pizz, spic), Cello Section (susvib, trem, pizzT, spic), Solo Violin (Arco Vib, Pizz, Trem, spic), Solo Contrabass (SusNV, SusVib, Pizz, Spic, Trem), **Harp**. **Keys:** Organ (Loud/Quiet), Upright Piano, Upright Nr1. **Pitched percussion:** **Glock**, Marimba, Xylo, Timpani (+rolls); glock glisses and Nepalese bells in "Miscellania Raw". **Woodwinds and brass:** flute, oboe, clarinet, bassoon, piccolo, horn, trumpet, trombones, tuba. **No celesta.** No contrabass *section* | Readme: 3,138 samples (v1.1.0). WAV, 44.1 kHz, 16/24-bit, SFZ mappings. Vanilla SFZ ~3 GB (page); GitHub repo ~2.3 GB | **Use.** Main CC0 source for string sustains, harp and glock |
| **VCSL** (Versilian Community Sample Library). [GitHub](https://github.com/sgossner/VCSL) | "Creative Commons 0 license. Essentially it's Public Domain- you can do whatever you want with these sounds (even make commercial software), no royalties, no credit, no special terms." | Concert Harp, Folk Harp, Grand Piano (Kawai, Steinway B), Upright Piano (Knight, Yamaha), harpsichords, Pipe Organ, Renaissance Organ, **Glockenspiel**, Tubular Glockenspiel, Tubular Bells, Vibraphone, Marimba, Wine Glasses, Hand Chimes, Mark Trees, gongs, timpani, TX81Z FM patches, lots of percussion. **No bowed strings, no celesta** (checked the file tree) | WAV 44.1/48 kHz, 16/24-bit, ~20–75 MB per instrument; SFZ on the releases page. Repo ~4 GB | **Use** for glock, chimes, bells and wine-glass textures |
| **VCSL Keys**. [page](https://versilian-studios.com/vcsl-keys/) | "VCSL Keys is under a Creative Commons 0 (CC0) license, as a derivative of VCSL." | 3 grands, 2 uprights, 5 harpsichords | 1,466 samples, SFZ | Optional. Packaged piano subset of VCSL |
| **Osiris Piano** (Karoryfer x Versilian, KVRDC 2026). [page](https://shop.karoryfer.com/pages/free-osiris-piano), [GitHub](https://github.com/sfzinstruments/Osiris_Piano) | "Open source, released under CC-0 license." Repo licence: CC0-1.0 | "a quiet piano sample library with low noise, consistent playability, multiple mic positions and a few non-traditional controls" | "Over 1200 samples adding up to 460 MB even with FLAC compression." SFZ. "Requires Plogue Sforzando 1.981 or newer" (sfizz compatibility unverified) | **Best CC0 soft-piano candidate.** Quiet dynamics, not literally felted |
| **Karoryfer x bigcat cello**. [page](https://karoryfer-samples.myshopify.com/pages/free-karoryfer-x-bigcat-cello) | Karoryfer free page: "All our free sample libraries are under a Creative Commons Zero license." Repo licence: CC0-1.0 | "close-miked and recorded without vibrato. All notes are sampled every minor third. In addition to bowed sustain, staccato and plucked notes, … harmonics slides and percussive noises." | 479 samples, 126 MB, SFZ (+Kontakt) | **Use** for an intimate solo-cello line (Moon / Jóhannsson colour) |
| **Karoryfer String Cyborgs**. [page](https://karoryfer-samples.myshopify.com/pages/free-string-cyborgs) | CC0 (same free-page statement) | Looped bowed cello/bass samples used as synth oscillators: "drones, pads, organs, evolving textures… string sounds" | 60 MB, 224 WAV, 43 presets, SFZ | **Use** for warm, organic string pads |
| **Etherealwinds Harp II: CE** (Versilian). [page](https://versilian-studios.com/etherealwinds-harp/) | "…this reduced version of the new library under a Creative Commons Attribution 4.0 International license." | Lever harp | 255 samples, 400 MB, SFZ + WAV | **CC-BY fallback** harp (needs a credits line) |
| **Upright Piano KW** (FreePats). [page](https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html) | "Published under the terms of the Creative Commons CC0 1.0 public domain dedication." | Kawai upright in a living room, Zoom H1, 2 velocity layers (not felt) | SFZ FLAC 32 MiB / WAV 69 MiB / SF2 27 MiB | Usable CC0 upright. Lo-fi recording; Osiris is better |
| **Salamander Grand Piano V3**. [FreePats](https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html), [archive.org](https://archive.org/details/SalamanderGrandPianoV3) | FreePats: "Creative Commons Attribution 3.0 license." archive.org metadata licenseurl: `creativecommons.org/licenses/by/3.0/`. No CC0 relicence found | Yamaha C5, 16 velocity layers, AKG C414 AB pair | SFZ FLAC 707 MiB / WAV 1.18 GiB / 44.1k 394 MiB / SF2 296 MiB | **CC-BY OK** (credit Alexander Holm). Bright concert grand, wrong colour for "felt" |
| **City Piano** (bigcat instruments) | "It is free and public domain. You can do anything you like with it." Quoted from the [KVR news post](https://kvraudio.com/news/bigcat-instruments-releases-city-piano---free-baldwin-piano-for-kontakt-5-24988); the primary bigcat page was not checked **(unverified)** | Baldwin baby grand, 4 velocity layers | ~304 MB, SFZ/Kontakt (per secondary sources) | Possible, but confirm on bigcat's own page first |
| **Univ. of Iowa MIS**. [page](https://theremin.music.uiowa.edu/MIS.html) | "Since 1997, these recordings have been freely available on this website and may be downloaded and used for any projects, without restrictions." | Solo violin, viola, cello, double bass; piano; bells (orchestra bells, i.e. glockenspiel; unverified), crotales, marimba, vibes, xylophone, gongs | Raw single-note AIFF/WAV (needs mapping) | OK licence-wise. Raw and dry; only worth it for gap-filling |
| **Freesound celesta packs** | Pack listings show "Creative Commons 0" on every sound | **[stamperadam: Celeste Samples](https://freesound.org/people/stamperadam/packs/6166/)**: "Recorded with spaced pair Neumann KM-184s", soft and hard per note (G#3–G#5 seen; full range unverified), plus note-off mechanics. **[Macsat-Rd: Celesta](https://freesound.org/people/Macsat-Rd/packs/23781/)**: Tascam DR-40, one "Medium" octave (~12 notes) | Single WAVs; map to SFZ yourself | **stamperadam is the CC0 celesta.** Virtual Playing Orchestra already uses it |
| **Sonatina Symphonic Orchestra** v4. [GitHub](https://github.com/peastman/sso) | "SSO may be used and distributed under the terms of the Creative Commons Sampling Plus 1.0 license." The [deed](https://creativecommons.org/licenses/sampling+/1.0/) allows distributing "this whole work for noncommercial purposes" only, and says "You may not use this work to advertise for or promote anything but the work you create from it." The author's own note: "In the case of a few very old soundfonts I have no idea who the original authors were or what licensing might apply." | Full orchestra incl. Celeste, Glockenspiel, Harp, string sections | ~1.3 GB repo, SFZ, 16-bit 44.1 kHz | **OUT.** NC clause on redistribution, a promotion clause that a portfolio could trip, and unclear provenance (it includes Philharmonia samples) |
| **Philharmonia Orchestra samples**. [page](https://philharmonia.co.uk/audio-sound-samples/) | "The only restriction is that they must not be sold or made available 'as is' (i.e. as samples or as a sampler instrument)." | All orchestral instruments, single notes | MP3 | **OUT** under the no-standalone-redistribution rule. Renders would be fine, but raw files can't be committed |
| No Budget Orchestra / Virtual Playing Orchestra. [VPO terms](http://virtualplaying.com/virtual-playing-orchestra/) | A mix of CC Sampling Plus, CC BY-SA 3.0/4.0, CC0 and Iowa terms | Compilations | — | **Skip.** Mixed provenance; take the CC0 parts at source instead |

**Render path for these libraries:** `sfizz_render` renders an SFZ instrument plus a MIDI file to WAV offline ([sfizz](https://github.com/sfztools/sfizz), BSD-2-Clause). Its man page: "render a MIDI file as a WAV file using an SFZ instrument description". There is no Homebrew formula, so build it from source (cmake is installed). Whether the macOS release tarball ships the CLI is unverified. Osiris and Salamander lean on ARIA-specific opcodes, so check them in sfizz before committing to them.

---

## 2. Offline rendering tools and reverb IRs

### Surge XT
- **Output licence**, quoted from the [FAQ](https://surge-synthesizer.github.io/faq/): "If you make songs, samples, sounds, patches, glitches, noise bombs, soundscapes, videos, movies, dog beat, or any other intellectual property using Surge XT, you own it and you don't need any license or permission from us or anyone else! … regardless if you started a patch from scratch or used one of the factory presets… The output of Surge XT is yours to do with as you want!"
- **surgepy is not on PyPI.** `pip index versions surgepy` returns "No matching distribution found", and `pypi.org/pypi/surgepy/json` is a 404. You build it from the Surge source, per the [README](https://github.com/surge-synthesizer/surge):
  ```
  cmake -Bignore/bpy -DSURGE_BUILD_PYTHON_BINDINGS=ON -DCMAKE_BUILD_TYPE=Release
  cmake --build ignore/bpy --parallel --target surgepy
  # then: sys.path.append("ignore/bpy/src/surge-python"); import surgepy
  ```
  `src/surge-python/pyproject.toml` uses scikit-build, so `pip install ./src/surge-python` may also work **(unverified)**.
- **It renders offline to numpy**, per the stubs in `surgepy/_surgepy/__init__.pyi`: `createSurge(sampleRate)`, `loadPatch(path)`, `playNote(ch, note, vel)`, `releaseNote(...)`, `createMultiBlock(blocks)` (returns `numpy.ndarray[float32]`), and `processMultiBlock(arr, startBlock, nBlocks)` ("Run the Surge XT engine for multiple blocks, updating the value in the numpy array"). Examples: [surge-python repo](https://github.com/surge-synthesizer/surge-python) and `scripts/ipy/Demonstrate Surge in Python.ipynb`.
- **No standalone CLI renderer** found **(unverified)**.
- Surge XT is not currently installed on this Mac. I checked /Applications and the VST3/CLAP folders.

### Other headless hosts and synths
| Tool | Licence | Scriptable offline path | Note |
|---|---|---|---|
| **pedalboard** (Spotify), PyPI 0.9.25 | GPL-3 ([README](https://github.com/spotify/pedalboard)) | "Supports VST3® instrument and effect plugins on macOS…" and "instrument and effect Audio Units on macOS". Pass MIDI to `load_plugin(...)` and get numpy back | Can host Surge XT VST3, Dexed and Vital without surgepy. Also has a built-in `Convolution` effect for the IRs below |
| **DawDreamer**, PyPI 0.9.0 | GPL-3 | Python DAW: VST instruments, automation, Faust | Alternative to pedalboard |
| **Dexed** (DX7 FM), v1.0.1 | GPL-3 ([GitHub](https://github.com/asb2m10/dexed)) | No CLI of its own. Render through pedalboard or DawDreamer (Dexed-specific test unverified) | Good for FM bells and EP colour |
| **Vital** | [EULA](https://vital.audio/eula): "can be used for commercial or non-commercial music and audio productions without the prior permission…" but "You are not permitted to redistribute presets, samples, wavetables, skins, LFOs or other media created from any unaltered VITAL AUDIO content" | Only through pedalboard/DawDreamer | Renders of music are fine. Never commit raw factory wavetables or one-shot samples from unaltered presets |

### Convolution reverb IRs (real rooms)
| Set | Licence (quoted) | Notes |
|---|---|---|
| **OpenAIR** (Univ. of York) | Each space's page: "This work is licensed under a Creative Commons Attribution 4.0 International License." Confirmed (via Wayback, 2026 snapshots) for **York Minster, Jack Lyons Concert Hall, St Paul's Cathedral, Lady Chapel St Albans, Arthur Sykes Rymer Auditorium, T2 Hangar**. Attribution line given: "www.openairlib.net Audiolab, University of York Damian T. Murphy" (York Minster) | **The live site now shows "Account Suspended"** (fetched 2026-10-04). The IR zips still download, e.g. `https://webfiles.york.ac.uk/OPENAIR/IRs/york-minster/york-minster.zip` (8.5 MB) and `…/jack-lyons-concert-hall-university-york/jack-lyons-concert-hall-university-york.zip` (8.5 MB). Licences are per IR, so check each one. **Recommended.** |
| **Voxengo free IRs**. [page](https://www.voxengo.com/impulses/) | "Permission is granted to anyone to use these impulse files royalty-free for any purpose, including commercial usage. … You may not copy and distribute these impulse files … unless: … copies are complete and unaltered…" | Synthetic, made "with Impulse Modeler", so not real rooms. Fine for rendering; **don't commit the IRs** |
| MIT IR Survey (Traer & McDermott). [page](https://mcdermottlab.mit.edu/Reverb/IR_Survey.html) | No licence stated on the page **(unverified)** | 271 everyday spaces; skip until a licence is found |
| EchoThief | Licence not confirmed **(unverified)** | — |

---

## 3. Finished ambient/space tracks as a "production benchmark"

I couldn't listen to any of these. Each "sounds like" line is the page's own description or tags.

| # | Title / artist | Licence (quoted from page) | Length | Page / file | How it reads (from the page) |
|---|---|---|---|---|---|
| 1 | **Immersed** by Kevin MacLeod | Incompetech credit block: "Licensed under Creative Commons: By Attribution 4.0 / http://creativecommons.org/licenses/by/4.0/" ([licences page](https://incompetech.com/music/royalty-free/licenses/)) | 4:09, 64 BPM | [page](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1600010). File: `https://incompetech.com/music/royalty-free/mp3-royaltyfree/Immersed.mp3` | Piano and strings. "Minimal and somewhat droney in parts… useful for time-lapse photography of the night sky… or maybe a rocket launch." **Closest match to the brief** |
| 2 | **Infinite Perspective** by Kevin MacLeod | CC BY 4.0 (as above) | 5:45, 80 BPM | [page](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1500024). File: `…/mp3-royaltyfree/Infinite%20Perspective.mp3` | Synths, voices, piano, harp, cor anglais, horn, flute. "All the beauty, awe and calm majesty…" The download includes faster and slower tempo versions |
| 3 | **At Rest** by Kevin MacLeod | CC BY 4.0 | 3:27, 57 BPM | [page](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100748). File: `…/mp3-royaltyfree/At%20Rest.mp3` | Piano chords, voice, strings and horns carry the melody; "sadness, but with a sense of closure and peace" |
| 4 | **Music for Manatees** by Kevin MacLeod | CC BY 4.0 | 17:36, free tempo | [page](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400009) | Piano, electric piano, strings, synth: "Beautiful slow moving piece with consonant sounds". Long and sectionless, useful as a pad-bed reference |
| 5 | **Vast Skyline** by Scott Holmes Music (album *Film & Documentary*) | "…is licensed under a Attribution License" with link to `creativecommons.org/licenses/by/4.0` | 2:22 | [FMA](https://freemusicarchive.org/music/Scott_Holmes/Film__Documentary/Vast_Skyline/). File: `https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Scott_Holmes/Film__Documentary/Scott_Holmes_-_08_-_Vast_Skyline.mp3` | Genres: Electronic / Soundtrack / Composed Music. FMA marks it "AI generated? No". **Ascending Light** from the same album (1:33, same licence) is a sibling. Many of Holmes's later tracks are NC, so check each page |
| 6 | **UnderStarway** by techtheist | "…is licensed under a Attribution 4.0 International License." | 6:58 | [FMA](https://freemusicarchive.org/music/techtheist/fma-2021/understarway/). File: `https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/0U7BJxaClVGqFvmIwjwuafgbrtTZpdrokssRJiCB.mp3` | "Calm music with orchestra sounds and repetitive rhythm for melancholic background." AI: No |
| 7 | **Free space ambient music 1 – Take off** by The Imperfectionist | "…is licensed under a Attribution 4.0 International License." | 6:10 | [FMA](https://freemusicarchive.org/music/the-imperfectionist/single/free-space-ambient-music-1-take-off/). File: `https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/OePXa18tQuYQUZLFdQF54iXAWW7iezCxPvrsW2Z6.mp3` | "A space ambient track composed with… Roland SP404 MK2 … Arturia Microfreak…". More synth than orchestral. AI: No |
| 8 | **Exploration Theme** by CleytonKauffman | OpenGameArt licence field: CC0 ("Credit/Attribution is optional") | 2:14 | [OGA](https://opengameart.org/content/exploration-theme). File: `https://opengameart.org/sites/default/files/exploration_theme.zip` (WAV/OGG/FLAC) | "Progressive synth/piano ambience with repeating chord patterns… Loops seamlessly: Yes." The CC0 loop pick |
| 9 | **Overlook (uplifting ambient loop)** by SondreDrakensson | Freesound: CC0 | 1:18 | [Freesound](https://freesound.org/people/SondreDrakensson/sounds/506495/) | "A slightly uplifting ambient loop inspired by Mirror's Edge." A short loop |

**Flagged, don't use without checking:**
- **First Light Particles** by Yoiyami ([OGA](https://opengameart.org/content/first-light-particles-%E2%80%93-cc0-atmospheric-pianoambient-track), CC0, Nov 2025). The description fits the brief closely ("soft shimmering piano… subtle low-frequency pulses… slightly cosmic"). Asked in the comments "What do you use to create these?", the author answered only "entirely composed from scratch by me." Provenance is unclear, and AI generation is possible **(unverified)**.
- **Forgotten Land** by doxent ([ccMixter](https://ccmixter.org/files/doxent/45486), "Licensed under Creative Commons Attribution (3.0)", 6:04; cello, violin, piano, ambient). Its description reads "Part of score based upon Forgotten Land by Joanne Gabriel". The underlying composition's rights are unverified, so skip it.
- **Space Graveyard** by TinyWorlds ([OGA](https://opengameart.org/content/space-graveyard-ambient-track), CC0, "Loops seamlessly"). Licence is fine, but it is tense, horror-leaning sci-fi, off-brief.

---

## 4. NASA public-domain audio

### NASA's guidelines, quoted ([NASA Images and Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/))
- **Copyright:** "NASA content – images, audio, video, and media files … – generally are not subject to copyright in the United States."
- **Endorsement and credit:** "NASA content used in a factual manner that does not imply endorsement may be used without needing explicit permission. NASA should be acknowledged as the source of the material."
- **Third-party material:** "NASA occasionally uses copyright-protected material of third parties with permission on its website. Those images will be marked identified as copyright protected with the name of the copyright holder. NASA's use does not convey any rights to others to use the same material."
- **Commercial use:** "If the NASA material is to be used for commercial purposes, including advertisements, it must not explicitly or implicitly convey NASA's endorsement of commercial goods or services."
- **Voices:** "If a NASA image, audio, video or media includes an identifiable person, using the media for commercial purposes may infringe that person's right of privacy or publicity, and permission should be obtained from the person." *This applies to astronaut and CAPCOM voice clips. Prefer clips without voices, or keep their use factual and non-promotional.*
- The [historical sounds page](https://www.nasa.gov/historical-sounds/) says: "For sound file use policy, please see Media Usage Guidelines."

### Candidates
| Want | Recording | URL | Status |
|---|---|---|---|
| **Launch rumble (best)** | Artemis II launch, 2026-04-01, pad-mic channel "Pad CS6" (WAV orig) and an ambisonic "Press Site Lawn" recording. Credit: NASA/Lorne Mathre | `http://images-assets.nasa.gov/audio/KSC-20260401-AU-LMM01-0001-Artemis_II_Live_Launch_Coverage_Pad_CS6/KSC-20260401-AU-LMM01-0001-Artemis_II_Live_Launch_Coverage_Pad_CS6~orig.wav`. Search images.nasa.gov for "Artemis II Live Launch Coverage" to find the other pad-camera-site channels (CS1, CS4, Azimuth 1/2, OE1/OE2) | NASA work, PD |
| Launch rumble | STS-135 launch, STS-131 "Sound of Launch", STS-26 and STS-41D liftoff, Atlas V launch, SLS audio | `https://www.nasa.gov/wp-content/uploads/2015/01/590318main_ringtone_135_launch.mp3`, `…/590189main_ringtone_131_launchNats.mp3`, `…/640392main_STS-26_Liftoff.mp3`, `…/663784main_SLS_Audio_D.mp3` | PD. ~20 s ringtone clips, MP3 only |
| Launch, other | SpaceX Crew-10 "Lift-off Sound Mix" and Crew-11 "Blast 1 and Blast 2" (NASA KSC recordings) | images.nasa.gov ids `KSC-20250314-AU-ILW01-0001-SpaceX_Crew-10_Live_Launch_Broadcast_Program-L_LoS-R-M11808`, `KSC-20250801-AU-LMM01-0001-SpaceX_Crew_11_Live_Launch_Coverage_Blast1_Blast2-M14833` | PD as NASA recordings. Some channels carry broadcast voice |
| **Apollo Quindar tones** | "Quindar: Sound #1 / #2" | `https://www.nasa.gov/wp-content/uploads/2015/01/578628main_hskquindar.mp3`, `…/578629main_hawquindar.mp3` | PD |
| Mission control ambience | Apollo 11 countdown, Discovery STS loop calls ("Roger roll", "MECO", "Go at throttle up"…), Artemis II "Program (CH1) LOS (CH2)", Crew-11 "Countdown Net" | `…/590320main_ringtone_apollo11_countdown.mp3`, `…/640170main_Roger20Roll.mp3`; images.nasa.gov ids as above | PD, but **voices**: see the identifiable-person caveat. No long, voice-free MOCR room tone found |
| Docking / latch | Nothing clean found in NASA's libraries. images.nasa.gov "docking" audio is all podcasts | — | **Gap.** Use the Freesound CC0 clunks in section 5 |
| ISS interior hum | None from NASA found. Chris Hadfield's SoundCloud recordings ("Ambient Noise of the Space Station", etc.) are a CSA astronaut's uploads, not NASA PD; licence **(unverified)**. Matthias Maurer's ISS sounds went to a Splice pack (not redistributable; unverified) | — | **Gap / OUT until a licence is confirmed.** Synthesize it (filtered noise plus fan tones) |
| **Plasma-wave "sounds of space"** | University of Iowa [space-audio.org](https://space.physics.uiowa.edu/plasma-wave/space-audio/): Voyager 1 interstellar, Voyager Jupiter/Saturn/Uranus/Neptune encounters, Juno Waves, Van Allen EMFISIS chorus, Cassini Saturn kilometric radiation and lightning | Index page above. Example: [Voyager 1 interstellar](https://space.physics.uiowa.edu/plasma-wave/voyager/v1pws_interstellar_2014.html) | **Not NASA PD: third party, CC BY 4.0.** "The audio files found at this site are available under a Creative Commons Attribution 4.0 International License." Preferred credit: "Original space audio recordings provided courtesy of NASA and The University of Iowa. https://space-audio.org/" ([citation](https://space.physics.uiowa.edu/plasma-wave/space-audio/citation.html)) |
| Same sounds, on NASA's page | Cassini "Saturn Radio Emissions #1/#2", "Spooky Saturn", Enceladus; Voyager "Interstellar Plasma Sounds", "Lightning on Jupiter"; EMFISIS "Chorus" | `…/584795main_saturn_radio_waves.mp3`, `…/584791main_spookysaturn.mp3`, `https://www.nasa.gov/externalflash/interstellar.mp3`, `…/603921main_voyager_jupiter_lightning.mp3`, `…/693857main_emfisis_chorus_1.mp3` | NASA marks the EMFISIS clip "Courtesy of … EMFISIS team at the University of Iowa". **Treat all Iowa-instrument clips as CC BY 4.0 and credit them**, even when taken from nasa.gov |
| Sonifications (Chandra/Hubble/Webb) | [chandra.si.edu/sound](https://chandra.si.edu/sound/) | — | [Policy](https://chandra.si.edu/photo/image_use.html): "For Chandra content, no claim to copyright is being asserted and the material may be used in accordance with NASA guidelines." It also warns that "material created and/or provided by individuals or institutions other than SAO … may claim copyright", and many sonifications credit SYSTEM Sounds (M. Russo, A. Santaguida). **Check each one (unverified).** They're also musical interpretations, which suits the "documentary-real" brief less |
| Misc | Sputnik beep, Kepler light-curve sonifications, Juno "HI" Morse | `…/578626main_sputnik-beep.mp3`, `…/578358main_kepler_star_KIC12268220C.mp3` | On NASA's page. Who made the Sputnik recording is unverified |

(`…/` = `https://www.nasa.gov/wp-content/uploads/2015/01/`)

---

## 5. Freesound CC0 SFX for scene changes

All are CC0 per each sound's page (the CC0 link `creativecommons.org/publicdomain/zero/1.0/` is on the page).

| Want | Candidates |
|---|---|
| Deep sub boom / impact | [Subterranean Deep Sub-Bass Rumble Drop](https://freesound.org/people/brktkrgll/sounds/856174/) (4 s); [Cinematic Low Pitch Impact](https://freesound.org/people/Jofae/sounds/408141/) (7 s, "rather gentle, and gradually fades out"); [boom.wav](https://freesound.org/people/Snapper4298/sounds/157245/) (808 sub, 1.7 s). *Avoid* LordHannes "Bass Boom" ("Created from Logic Samples"): Apple loop content inside a CC0 upload has unclear provenance |
| Mechanical latch / clamp clunk | [MechanicalClamp.wav](https://freesound.org/people/Skullsmasha/sounds/123253/) ("Heavy mechanical clamping mechanism", 4.7 s); [cemeterygate16.aif](https://freesound.org/people/celadon_noise/sounds/399449/) (wrought-iron gate, "heavy clunking sound of latch", field recording); [Box with Metal Latches Hit 2](https://freesound.org/people/suspensiondigital/sounds/389705/) |
| Servo whir | [ServoMotor.wav](https://freesound.org/people/derjuli/sounds/824121/) (18 s, 48 kHz, Zoom H1); [Servo motor](https://freesound.org/people/Burningmonkey/sounds/322021/) (sweeping, 8.7 s); [window shade servo](https://freesound.org/people/kyles/sounds/454376/) |
| Stone / ice crack and grind | [ice cracking on river](https://freesound.org/people/kyles/sounds/637608/) (19 min, Sony PCM-D50 XY: a rich source); [Ice Cracks](https://freesound.org/people/karlis.stigis/sounds/168712/) (92 s, frozen puddle); [Stone Slab Door Grinding](https://freesound.org/people/NahuelMartinez/sounds/844329/) (17 s); [Drone 32](https://freesound.org/people/bernhoftbret/sounds/661790/) ("stone or crystalline surface grinding", 120 s) |
| Slow riser / swell | [riser 3.wav](https://freesound.org/people/reathance/sounds/503818/) (20 s); [Long Riser Hit PS-001](https://freesound.org/people/AudioPapkin/sounds/812628/) (44 s) |
| Soft shimmer | [SHIMMER FX](https://freesound.org/people/harrisonlace/sounds/771946/) (20.6 s); [Soulgaze C guitar Shimmer FX](https://freesound.org/people/Dpath/sounds/704696/) (14 s); [Ambient F# minor Ethereal Choir Pad](https://freesound.org/people/deadrobotmusic/sounds/808032/) (3.6 min paulstretched choir, a shimmer bed) |

Freesound CC0 is only as clean as the uploader's honesty. Prefer field recordings and sounds the uploader says they made themselves, as noted above.
