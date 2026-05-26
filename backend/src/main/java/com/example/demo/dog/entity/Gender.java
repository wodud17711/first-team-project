package com.example.demo.dog.entity;

/**
 * 반려견 성별. DB ENUM('M', 'F')와 매핑된다.
 *
 * <p>값이 영문 코드와 동일하므로 별도 컨버터 없이
 * {@link jakarta.persistence.EnumType#STRING} 으로 매핑 가능하다.
 */
public enum Gender {
    M, F
}
