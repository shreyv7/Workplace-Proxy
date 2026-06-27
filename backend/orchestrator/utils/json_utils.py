"""Robust JSON extraction utilities for parsing LLM responses.

Gemini occasionally wraps JSON in markdown code blocks or adds trailing text.
These helpers make JSON extraction resilient without being fragile.
"""
from __future__ import annotations

import json
import re
from typing import Any


def _unwrap_single_item_list(parsed: Any) -> Any:
    """
    Unwrap [dict] → dict.

    LLMs occasionally wrap a JSON object in a one-element array, e.g.
    '[{"approved": true}]' instead of '{"approved": true}'.
    When that happens every downstream .get() call raises AttributeError.
    Only unwrap when the list has exactly one element and it is a dict —
    leaving multi-element lists and non-dict elements untouched.
    """
    if isinstance(parsed, list) and len(parsed) == 1 and isinstance(parsed[0], dict):
        return parsed[0]
    return parsed


def extract_json(text: str) -> Any:
    """
    Extract and parse JSON from an LLM text response using multiple strategies.

    Tries in order:
    1. Direct JSON parse of the full text
    2. Markdown fenced code block (```json ... ``` or ``` ... ```)
    3. First balanced brace/bracket pair in the text

    Raises ValueError if all strategies fail.
    """
    text = text.strip()

    # Strategy 1: direct parse
    try:
        return _unwrap_single_item_list(json.loads(text))
    except json.JSONDecodeError:
        pass

    # Strategy 2: markdown code block
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if match:
        candidate = match.group(1).strip()
        try:
            return _unwrap_single_item_list(json.loads(candidate))
        except json.JSONDecodeError:
            pass

    # Strategy 3: find first balanced brace or bracket
    for start_char, end_char in [("{", "}"), ("[", "]")]:
        start_idx = text.find(start_char)
        if start_idx == -1:
            continue
        depth = 0
        in_string = False
        escape_next = False
        for i, ch in enumerate(text[start_idx:], start=start_idx):
            if escape_next:
                escape_next = False
                continue
            if ch == "\\" and in_string:
                escape_next = True
                continue
            if ch == '"' and not escape_next:
                in_string = not in_string
                continue
            if in_string:
                continue
            if ch == start_char:
                depth += 1
            elif ch == end_char:
                depth -= 1
                if depth == 0:
                    candidate = text[start_idx : i + 1]
                    try:
                        return json.loads(candidate)
                    except json.JSONDecodeError:
                        break

    raise ValueError(
        f"Could not extract JSON from LLM response. "
        f"First 300 chars: {text[:300]!r}"
    )
