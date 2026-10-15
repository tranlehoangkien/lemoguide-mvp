package lemonadex.lemoguide.lemoguide_mvp.plan.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link BillingCycle} to the lowercase tokens of the {@code plan.billing_cycle} ENUM. */
@Converter(autoApply = false)
public class BillingCycleConverter implements AttributeConverter<BillingCycle, String> {

    @Override
    public String convertToDatabaseColumn(BillingCycle attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public BillingCycle convertToEntityAttribute(String dbData) {
        return dbData == null ? null : BillingCycle.valueOf(dbData.trim().toUpperCase());
    }
}
