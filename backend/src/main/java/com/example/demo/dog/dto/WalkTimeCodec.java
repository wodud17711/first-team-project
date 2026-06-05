package com.example.demo.dog.dto;

import java.util.List;

/**
 * 선호 산책 시간대(0~23시) 리스트 ↔ CSV 문자열 변환.
 *
 * <p>API 계약은 정수 배열({@code [1,3,16]}), DB 저장은 CSV 문자열({@code "1,3,16"}).
 * 중복 제거 + 오름차순 정렬해서 저장한다.
 */
public final class WalkTimeCodec {

    private WalkTimeCodec() {
    }

    /** 리스트 → CSV. null/빈 리스트는 null 반환(컬럼 NULL). */
    public static String toCsv(List<Integer> hours) {
        if (hours == null || hours.isEmpty()) {
            return null;
        }
        return hours.stream()
                .distinct()
                .sorted()
                .map(String::valueOf)
                .reduce((a, b) -> a + "," + b)
                .orElse(null);
    }

    /** CSV → 리스트. null/빈 문자열은 빈 리스트 반환. */
    public static List<Integer> toList(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }
        return java.util.Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Integer::valueOf)
                .toList();
    }
}
