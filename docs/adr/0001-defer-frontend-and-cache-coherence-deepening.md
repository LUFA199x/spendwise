# Defer the frontend seam and cache-coherence deepening

An architecture review in September 2026 surfaced four deepening opportunities. Two were
built — a `sessionCache` module and an `ownedCollection`/`collectionStore` pair — and two
were deliberately left alone: putting a seam between `SpendWise.jsx`'s data and its views,
and giving the three cache layers (sessionStorage, Redis, Postgres) one invalidation
contract. Depth pays for itself against *future* change, and SpendWise is parked and
serves exactly one user, so neither deferred candidate has anything to amortise against.

## Considered options

`SpendWise.jsx` is 2,661 lines and holds design tokens, eight pages, the scanner and the
root state container, with the root existing mainly to thread four arrays and nine
handlers downward. It is the repo's largest hot spot (10 of 24 commits) and the most
obvious thing a reviewer will want to break up. It was left intact because it has not
changed since May 2026 and a page that never changes costs nothing to leave whole.

The three cache layers key the same collection differently and with unrelated lifetimes,
so a write busts two of them independently with nothing guaranteeing both. With one user
the resulting stale reads are unobservable and self-heal on the 60s Redis TTL.

## Consequences

Both remain correct candidates and should be reopened the moment SpendWise is under
active development again — particularly the frontend seam, which was scored *Worth
exploring* rather than *Strong* purely on the staleness of the file. Until then, a future
architecture review should not re-suggest either: the reason they are fine is not visible
in the code.
