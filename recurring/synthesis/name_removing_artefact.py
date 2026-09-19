"""SF-7063 — name the artefact that would end the repetition.

Keyed off the cluster's dominant entity area: duplicated supplier-document reads →
"a stored extract per contract"; otherwise a phrasing kit (Satzbaukasten). If the
pattern has ceased (a cessation was detected), the artefact notes it is likely already
resolved.

Note: the spec signature is (rc, cadence); `cessation` is taken too so "likely
already resolved" can be expressed (deviation recorded in SESSION-LOG).
"""
from __future__ import annotations

from ..types import Artefact, Cadence, Cessation, ResolvedCluster

_ARTEFACT_BY_AREA = {
    "lieferanten-konditionen": "ein gespeicherter Auszug je Vertrag",
    "preise-margen": "eine gepflegte Preis-/Margentabelle",
    "kundendaten": "ein gepflegter Kundenstammdaten-Auszug",
    "quellcode-repositories": "eine interne Referenz statt wiederholter Fragen",
}
_DEFAULT_ARTEFACT = "ein Satzbaukasten für wiederkehrende Formulierungen"


def name_removing_artefact(rc: ResolvedCluster, cadence: Cadence | None, cessation: Cessation | None = None) -> Artefact:
    top_area = max(rc.entities, key=lambda e: e.count).area if rc.entities else ""
    description = _ARTEFACT_BY_AREA.get(top_area, _DEFAULT_ARTEFACT)
    if cessation is not None:
        description = f"{description} (Muster zuletzt {cessation.last_day} — vermutlich bereits gelöst)"
    return Artefact(description=description, likely_resolved=cessation is not None)
