from recurring.semantic.embed_documents import embed_documents
from recurring.types import FeatureDoc


class FakeEmbedder:
    model_version = "fake@1"

    def __init__(self):
        self.calls = 0

    def embed(self, text):
        self.calls += 1
        # deterministic vector from the text length + first char code
        return (float(len(text)), float(ord(text[0]) if text else 0), 1.0)


def _doc(entry_id, text):
    return FeatureDoc(entry_id=entry_id, conversation_id="c", ts="t", redacted_text=text, pseudonyms=(), key_epoch=1, shingles=frozenset())


def test_a_cached_vector_per_doc_keyed_by_text_hash():
    vecs = embed_documents([_doc("a", "hallo welt")], FakeEmbedder())
    assert "a" in vecs
    assert len(vecs["a"]) == 3


def test_same_text_twice_identical_vector_and_embedded_once():
    m = FakeEmbedder()
    vecs = embed_documents([_doc("a", "gleicher text"), _doc("b", "gleicher text")], m)
    assert vecs["a"] == vecs["b"]
    assert m.calls == 1  # cached by text hash


def test_model_version_available_for_provenance():
    assert FakeEmbedder().model_version == "fake@1"
