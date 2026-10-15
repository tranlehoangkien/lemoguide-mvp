package lemonadex.lemoguide.lemoguide_mvp.aiclient;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiProvider;

/** Resolves the {@link AiChatClient} for a model's {@link AiProvider}. */
@Component
public class AiChatClientRegistry {

    private final Map<AiProvider, AiChatClient> clientsByProvider;

    public AiChatClientRegistry(List<AiChatClient> clients) {
        this.clientsByProvider = clients.stream()
                .collect(Collectors.toUnmodifiableMap(AiChatClient::provider, Function.identity()));
    }

    public AiChatClient resolve(AiProvider provider) {
        AiChatClient client = clientsByProvider.get(provider);
        if (client == null) {
            throw new AiChatException("No chat client is configured for provider " + provider);
        }
        return client;
    }
}
