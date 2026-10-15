package lemonadex.lemoguide.lemoguide_mvp.network;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.*;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import jakarta.annotation.PreDestroy;

/**
 * Server-sent events for LemoNetwork: each open tab holds one stream, and services push a small "something changed"
 * signal (never content) after their transaction commits. Clients then refetch through the normal, access-checked API,
 * so the stream can never leak data the viewer is not allowed to read. Single-instance, in-memory registry.
 */
@Component
public class NetworkEvents {
    static final long TIMEOUT_MS = 30L * 60 * 1000;
    private static final int MAX_STREAMS_PER_ACCOUNT = 5;
    private final Map<Long, Set<SseEmitter>> streams = new ConcurrentHashMap<>();
    private final ScheduledExecutorService heartbeat = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "network-sse-heartbeat");
        t.setDaemon(true);
        return t;
    });

    public NetworkEvents() {
        // Proxies drop idle connections; a comment line every 25s keeps the stream open and reaps dead clients.
        heartbeat.scheduleAtFixedRate(() -> streams.forEach((id, set) -> set.forEach(e -> send(id, e, SseEmitter.event().comment("ping")))), 25, 25, TimeUnit.SECONDS);
    }

    public SseEmitter subscribe(long accountId) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        Set<SseEmitter> set = streams.computeIfAbsent(accountId, k -> ConcurrentHashMap.newKeySet());
        if (set.size() >= MAX_STREAMS_PER_ACCOUNT) set.stream().findFirst().ifPresent(old -> { set.remove(old); old.complete(); });
        set.add(emitter);
        Runnable drop = () -> remove(accountId, emitter);
        emitter.onCompletion(drop);
        emitter.onTimeout(drop);
        emitter.onError(e -> drop.run());
        send(accountId, emitter, SseEmitter.event().name("ready").data("{}"));
        return emitter;
    }

    /** Signals `type` (notification, message, cohort, buddy) to one account once the current transaction commits. */
    public void publish(long accountId, String type, Object ref) {
        publish(List.of(accountId), type, ref);
    }

    public void publish(Collection<Long> accountIds, String type, Object ref) {
        List<Long> targets = List.copyOf(accountIds);
        String payload = "{\"type\":\"" + type + "\",\"ref\":" + (ref instanceof Number ? ref : "null") + "}";
        Runnable push = () -> targets.forEach(id -> streams.getOrDefault(id, Set.of())
                .forEach(e -> send(id, e, SseEmitter.event().name("network").data(payload))));
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { push.run(); }
            });
        } else push.run();
    }

    private void send(long accountId, SseEmitter emitter, SseEmitter.SseEventBuilder event) {
        try { emitter.send(event); }
        catch (IOException | IllegalStateException ex) { remove(accountId, emitter); }
    }

    private void remove(long accountId, SseEmitter emitter) {
        streams.computeIfPresent(accountId, (k, set) -> { set.remove(emitter); return set.isEmpty() ? null : set; });
    }

    @PreDestroy
    void shutdown() {
        heartbeat.shutdownNow();
        streams.values().forEach(set -> set.forEach(SseEmitter::complete));
    }
}
