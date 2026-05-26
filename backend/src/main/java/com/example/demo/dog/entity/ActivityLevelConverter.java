package com.example.demo.dog.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * {@link ActivityLevel} ↔ DB 한글 ENUM('저','중','고') 매핑 컨버터.
 *
 * <p>{@code @Convert(converter = ActivityLevelConverter.class)} 로 필드에 지정해 사용한다.
 * 다른 한글 ENUM 컬럼에 자동 적용되지 않도록 {@code autoApply = false} (기본값) 로 둔다.
 */
@Converter
public class ActivityLevelConverter implements AttributeConverter<ActivityLevel, String> {

    @Override
    public String convertToDatabaseColumn(ActivityLevel attribute) {
        return attribute == null ? null : attribute.getLabel();
    }

    @Override
    public ActivityLevel convertToEntityAttribute(String dbData) {
        return ActivityLevel.fromLabel(dbData);
    }
}
