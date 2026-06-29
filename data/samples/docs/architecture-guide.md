# Billing Service Architecture Notes

- `billing-service` owns payment webhook ingestion and event processing.
- Webhook handlers must be idempotent because providers may retry delivery.
- Transient failures (timeouts, 5xx) should use exponential backoff.
- Permanent failures must be routed to a dead-letter queue for manual replay.
- All retry attempts must emit metrics: `webhook_retry_count`, `webhook_dlq_total`.

## PR Quality Bar

Production PRs should include:

1. Summary linked to Jira acceptance criteria
2. Risk assessment for replay/idempotency
3. Test plan with happy path and failure path
4. Rollout notes for observability dashboards
