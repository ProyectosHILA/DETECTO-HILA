# Security Specification - DETECTO HILA Firestore

## 1. Data Invariants
1. Every document in `/pacientes/{pacienteId}` MUST have a valid ID matching `^[a-zA-Z0-9_\-]+$` (<= 128 chars) equal to `data.id`.
2. Immutable creation fields (`id`, `codigo`, `fechaCreacion`) MUST NOT be altered after creation.
3. All clinical enums (`estado`, `faseActual`, `categoriaTriage`) and array lengths (`criteriosTamizaje.size() == 8`, `puntajeTamizaje` in `0..8`) are strictly validated on both `create` and `update`.
4. All string lengths are strictly bounded (`identificacionPaciente <= 128`, `nombre <= 200`, `diagnosticoTriage <= 4000`, etc.) to prevent payload exhaustion.
5. `keys().hasOnly(...)` blocks any shadow/ghost fields from being written to `/pacientes` or `/counters`.
6. Permanent deletion (`delete`) on `/pacientes/{pacienteId}` is only allowed after the case has been moved to trash (`resource.data.enPapelera == true`).
7. `/counters/pacientes_seq` only allows monotonic integer values (`lastSeq` in `1..999999`) with no extra fields.

## 2. Adversarial Payloads Guarded Against ("Dirty Dozen")
1. Ghost field injection (`{ ..., isVerified: true }`) -> Blocked by `keys().hasOnly(...)`.
2. Oversized `pacienteId` path variable (1.5KB string) -> Blocked by `isValidId(pacienteId)`.
3. Oversized string field (`diagnosticoTriage` > 4000 chars) -> Blocked by `.size() <= 4000`.
4. Invalid `estado` value (`"hacked"`) -> Blocked by enum allowlist.
5. Invalid `faseActual` value (`99`) -> Blocked by enum allowlist `[1, 2, 3, 4]`.
6. Tampering immutable `id` or `codigo` or `fechaCreacion` on update -> Blocked by immutability check.
7. Invalid `criteriosTamizaje` length (`size() != 8`) -> Blocked by `criteriosTamizaje.size() == 8`.
8. Out-of-bounds `puntajeTamizaje` (`999` or `-1`) -> Blocked by `0..8` check.
9. Hard-deleting an active patient (`enPapelera != true`) -> Blocked by `existing().enPapelera == true`.
10. Unbounded nested keys or non-map `estadosModulos` -> Blocked by `is map` type validation.
11. Counter manipulation outside `pacientes_seq` -> Blocked by `counterId == 'pacientes_seq'`.
12. Catch-all arbitrary collection writes (`/random/{id}`) -> Blocked by default-deny rule.
