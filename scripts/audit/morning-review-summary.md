# Morning review — Words 3000 campaign

2026-09-12. Branch `feat/words-3000`, **not pushed**. Overnight skipped per-batch spot-check; this is the human pass.

## Totals after elite-05 (`d8d67c0`)

| Metric | Value | Target |
| --- | --- | --- |
| CSV rows | 13129 | — |
| Core | 10274 | — |
| Pack | 3 | — |
| Reject | 2852 | — |
| Review | 0 | — |
| **Hard core** | **3110** | ≥3000 |
| **Elite core** | **3232** | ≥3000 |
| Campaign generated | 6069 | — |
| Campaign kept core | 4865 | — |
| Campaign rejected | 1204 | — |

Schema `words:validate`: **0 errors**. Floor 40 / cap 240: **all 36 categories met on both tiers**. Food elite 204 / 240.

`npm run typecheck` and `npm run lint` passed. `npm test`: 27/28 suites passed; one spec fixture collided with a live LLM override (`пихатий`) and was switched to a nonce word.

## Hard core by category (floor 40 / cap 240)

animals 82, nature 61, food 145, drinks 83, body 121, clothing 97, home 113, tools 85, transport 86, technology 78, places 93, cities 64, travel 98, family 90, people 90, professions 69, sports 83, games 144, music 97, movies 100, tv 86, internet 86, brands 58, school 97, work 84, holidays 96, events 86, history 59, science 69, society 60, emotions 66, personality 71, relationships 75, actions 88, behavior 85, abstract 65.

## Elite core by category (floor 40 / cap 240)

animals 95, nature 93, food 204, drinks 83, body 99, clothing 90, home 95, tools 80, transport 107, technology 69, places 106, cities 92, travel 97, family 90, people 63, professions 96, sports 68, games 95, music 98, movies 67, tv 97, internet 79, brands 102, school 93, work 77, holidays 91, events 74, history 64, science 92, society 66, emotions 66, personality 102, relationships 93, actions 96, behavior 74, abstract 79.

## Batch yield

| Batch | Tier | Generated | Core | Reject | Keep |
| --- | --- | ---: | ---: | ---: | ---: |
| hard-01 | hard | 299 | 181 | 118 | 60.5% |
| hard-02 | hard | 420 | 184 | 236 | 43.8% |
| hard-03 | hard | 429 | 307 | 122 | 71.6% |
| hard-04 | hard | 440 | 318 | 122 | 72.3% |
| hard-05 | hard | 498 | 370 | 128 | 74.3% |
| hard-06 | hard | 495 | 405 | 90 | 81.8% |
| hard-07 | hard | 499 | 399 | 100 | 80.0% |
| hard-08 | hard | 500 | 407 | 93 | 81.4% |
| elite-01 | elite | 500 | 459 | 41 | 91.8% |
| elite-02 | elite | 494 | 456 | 38 | 92.3% |
| elite-03 | elite | 496 | 465 | 31 | 93.8% |
| elite-04 | elite | 500 | 454 | 46 | 90.8% |
| elite-05 | elite | 499 | 460 | 39 | 92.2% |

## Pickers

Accept/Reject for **every new campaign core** card (100% sample). One HTML per batch:

`scripts/audit/morning-review/<batch>.html`

Open in a browser. Download `spotcheck-decisions.json` from the picker.

## Apply a batch after review

```bash
nvm use
cp ~/Downloads/spotcheck-decisions.json scripts/audit/spotcheck-decisions.json
npm run words:apply-spotcheck -- <batch>
npm run words:group-subsets
npm run words:validate
npm run words:build
```

`words:apply-spotcheck` rejects flagged rows. If reject rate of the sample is **> 5%**, the rest of that batch’s remaining `core` rows flip back to `review`.

Do **not** commit `occupied-keys.json`, `*-context/`, `*-split/`, `merge-draft-batch.ts`, or `spotcheck-picker.html`.
