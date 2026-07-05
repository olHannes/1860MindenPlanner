from types import SimpleNamespace

from bson import ObjectId


class FakeCursor(list):
    def sort(self, key, direction=1):
        reverse = direction == -1

        return FakeCursor(
            sorted(
                self,
                key=lambda document: self._get_nested(document, key),
                reverse=reverse,
            )
        )

    def _get_nested(self, document, key):
        current = document

        for part in key.split("."):
            if not isinstance(current, dict):
                return None

            current = current.get(part)

        return current


class FakeCollection:
    def __init__(self, documents=None):
        self.documents = documents or []
        self.update_calls = []
        self.insert_calls = []
        self.delete_calls = []

    def insert_one(self, document):
        self.insert_calls.append(document)

        if "_id" not in document:
            document["_id"] = ObjectId()

        self.documents.append(document)
        return SimpleNamespace(inserted_id=document["_id"])

    def find(self, query=None, projection=None):
        if query is None:
            query = {}

        results = []

        for document in self.documents:
            if self._matches(document, query):
                results.append(self._apply_projection(document, projection))

        return FakeCursor(results)

    def _apply_projection(self, document, projection):
        if projection is None:
            return document.copy()

        projected_document = {}

        include_fields = [key for key, value in projection.items() if value == 1]

        for key in include_fields:
            if key in document:
                projected_document[key] = document[key]

        # MongoDB gibt _id standardmäßig mit zurück,
        # außer man setzt explizit "_id": 0
        if projection.get("_id") != 0 and "_id" in document:
            projected_document["_id"] = document["_id"]

        return projected_document

    def find_one(self, query):
        for document in self.documents:
            if self._matches(document, query):
                return document
        return None

    def count_documents(self, query):
        return sum(1 for document in self.documents if self._matches(document, query))

    def delete_one(self, query):
        self.delete_calls.append(("delete_one", query))

        for index, document in enumerate(self.documents):
            if self._matches(document, query):
                del self.documents[index]
                return SimpleNamespace(deleted_count=1)

        return SimpleNamespace(deleted_count=0)

    def delete_many(self, query):
        self.delete_calls.append(("delete_many", query))

        before = len(self.documents)
        self.documents = [
            document for document in self.documents if not self._matches(document, query)
        ]
        deleted_count = before - len(self.documents)

        return SimpleNamespace(deleted_count=deleted_count)

    def update_one(self, query, update):
        self.update_calls.append((query, update))

        document = self.find_one(query)
        if document is None:
            return None

        if "$inc" in update:
            for key, value in update["$inc"].items():
                document[key] = document.get(key, 0) + value

        if "$set" in update:
            for key, value in update["$set"].items():
                self._set_nested(document, key, value)

        if "$unset" in update:
            for key in update["$unset"].keys():
                self._unset_nested(document, key)

        return None

    def _matches(self, document, query):
        for key, expected_value in query.items():
            actual_value = self._get_nested(document, key)

            if actual_value != expected_value:
                return False

        return True

    def _get_nested(self, document, key):
        current = document

        for part in key.split("."):
            if not isinstance(current, dict):
                return None

            current = current.get(part)

        return current

    def _set_nested(self, document, key, value):
        current = document
        parts = key.split(".")

        for part in parts[:-1]:
            current = current.setdefault(part, {})

        current[parts[-1]] = value

    def _unset_nested(self, document, key):
        current = document
        parts = key.split(".")

        for part in parts[:-1]:
            current = current.get(part, {})

        current.pop(parts[-1], None)
