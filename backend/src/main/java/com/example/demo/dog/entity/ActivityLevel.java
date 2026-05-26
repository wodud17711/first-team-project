package com.example.demo.dog.entity;

/**
 * 반려견 활동량. DB ENUM('저', '중', '고') 한글 값과 매핑된다.
 *
 * <p>Java 식별자는 영문으로 두고, DB 저장값은 {@link #getLabel() label}을 사용한다.
 * 매핑은 {@link ActivityLevelConverter} 가 담당한다.
 */
public enum ActivityLevel {
    LOW("저"),
    MEDIUM("중"),
    HIGH("고");

    private final String label;

    ActivityLevel(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    /** DB·요청 값(한글)에서 enum 으로 변환한다. {@code null} 입력은 그대로 반환. */
    public static ActivityLevel fromLabel(String label) {
        if (label == null) {
            return null;
        }
        for (ActivityLevel level : values()) {
            if (level.label.equals(label)) {
                return level;
            }
        }
        throw new IllegalArgumentException("Unknown activity level: " + label);
    }
}
