# Капелюх

Offline Ukrainian party game: one device, 2–N teams, one shared hat of words played across three rounds.

## Language

**Hat**:
The remaining words still to be guessed in the current round.
_Avoid_: deck, pile, queue, bag

**Word source**:
How a match's session words are obtained: the bundled set or a custom hat.
_Avoid_: pack (for this choice), mode, word set type

**Bundled set**:
Session words selected from the shipped word list.
_Avoid_: default pack, base pack, built-in pack

**Custom hat**:
Session words typed by the players before the first round. They exist only for that match.
_Avoid_: custom pack, user pack, private pack

**Session words**:
The opaque word identities that make up one match. The same identities are replayed in all three rounds.
_Avoid_: deck, vocabulary, word list (when you mean this match's pool)

**Pack**:
A named collection of shipped words. Not player-typed words.
_Avoid_: using pack for a custom hat

### Recap

**Recap**:
The post-match highlight carousel between the last review and the podium.
_Avoid_: statistics (for this sequence). Status `stat_carousel` and route `statistic.tsx` are leftover implementation names for Recap, not the product term.

**Recap card**:
One highlight in the recap. The last card's title is «Статистика гри».
_Avoid_: statistic, slide (for the card). That summary title is copy on one card, not the sequence name.

**Attempt**:
One exposure of a session word as skipped, guessed, or awarded to a team.
_Avoid_: try, play

**Score gap**:
Winner total minus runner-up total.
_Avoid_: margin, spread

**Guess duration**:
The sum of successful guess intervals for one session word across all rounds.
_Avoid_: think time, reaction time
