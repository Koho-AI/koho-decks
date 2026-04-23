# Built-in template group names accepted by `generate_presentation(template=...)`.
# Each entry must have a matching group directory under
# `servers/nextjs/app/presentation-templates/<name>/` that is registered in
# `servers/nextjs/app/presentation-templates/index.tsx`.
#
# To add a new built-in template:
#   1. Create the React layouts under presentation-templates/<name>/
#   2. Register the group + entries in presentation-templates/index.tsx
#   3. Add the name here
#
# Custom (user-uploaded) templates are NOT listed here — they use a
# `custom-<uuid>` prefix and are resolved from TemplateModel rows at
# request time (see presentation.py::check_if_api_request_is_valid).
DEFAULT_TEMPLATES = [
    "general",
    "modern",
    "standard",
    "swift",
    "koho-pitch",
    "koho-pitch-light",
]
