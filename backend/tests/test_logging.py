import json
import logging
from typing import Any
import pytest
from orchestrator.utils.logging_config import _FallbackLogger, _JSONFormatter

def test_fallback_logger_binds_and_logs(capsys: pytest.CaptureFixture[str]) -> None:
    # Set up basic logger with the JSON formatter
    logger = logging.getLogger("test_fallback")
    logger.setLevel(logging.INFO)
    
    # Clear existing handlers
    logger.handlers = []
    
    # Create handler with the JSON Formatter
    class ListHandler(logging.Handler):
        def __init__(self) -> None:
            super().__init__()
            self.records: list[str] = []

        def emit(self, record: logging.LogRecord) -> None:
            self.records.append(self.format(record))

    handler = ListHandler()
    handler.setFormatter(_JSONFormatter())
    logger.addHandler(handler)

    # Wrap it
    fallback_logger = _FallbackLogger(logger)

    # Test standard log
    fallback_logger.info("msg_1", extra_field="value_1")
    
    # Test bind
    bound_logger = fallback_logger.bind(bound_field="value_2")
    bound_logger.info("msg_2", local_field="value_3")

    # Test unbind
    unbound_logger = bound_logger.unbind("bound_field")
    unbound_logger.info("msg_3", local_field="value_4")

    # Check formatted records
    assert len(handler.records) == 3

    log_1 = json.loads(handler.records[0])
    assert log_1["message"] == "msg_1"
    assert log_1["extra_field"] == "value_1"

    log_2 = json.loads(handler.records[1])
    assert log_2["message"] == "msg_2"
    assert log_2["bound_field"] == "value_2"
    assert log_2["local_field"] == "value_3"

    log_3 = json.loads(handler.records[2])
    assert log_3["message"] == "msg_3"
    assert "bound_field" not in log_3
    assert log_3["local_field"] == "value_4"
