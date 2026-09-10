"""Helper used across the apps to append to the activity feed."""

import logging

from .models import ActivityLog

logger = logging.getLogger(__name__)


def log_activity(
    *,
    action,
    entity,
    description,
    actor=None,
    entity_id=None,
    entity_name="",
    client=None,
):
    """
    Append an entry to the activity feed.

    Logging is best-effort: a failure here must never break the business
    operation that triggered it.
    """
    try:
        actor_is_user = actor is not None and getattr(actor, "is_authenticated", False)
        return ActivityLog.objects.create(
            actor=actor if actor_is_user else None,
            actor_name=actor.get_full_name() if actor_is_user else "System",
            action=action,
            entity=entity,
            entity_id=entity_id,
            entity_name=entity_name or "",
            description=description,
            client=client,
        )
    except Exception:  # pragma: no cover - defensive
        logger.exception("Failed to write activity log entry")
        return None
