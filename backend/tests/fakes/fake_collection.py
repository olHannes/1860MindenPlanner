class FakeCollection:
    def __init__(self, documents=None):
        self.documents = documents or []
        self.update_calls = []

    def find_one(self, query):
        for document in self.documents:
            if self._matches(document, query):
                return document
        return None

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