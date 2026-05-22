package com.example.demo.dog.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 견종 마스터 (dog_breeds).
 *
 * <p>시드 데이터로 채워지며 애플리케이션에서는 <b>read-only</b> 로 사용한다.
 * 도메인 메서드를 두지 않고 단순 매핑만 수행한다.
 *
 * <p>한글 ENUM 컬럼 매핑 방침:
 * <ul>
 *   <li>{@code required_activity} → {@link ActivityLevel} (쓰기 발생 가능성 대비 enum)</li>
 *   <li>{@code size}, {@code coat_type} → 단순 {@code String} (read-only 이므로 충분)</li>
 * </ul>
 */
@Entity
@Table(name = "dog_breeds")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DogBreed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name_kr", nullable = false, length = 50)
    private String nameKr;

    @Column(name = "name_en", length = 50)
    private String nameEn;

    @Column(name = "size", length = 10)
    private String size;

    @Column(name = "avg_weight_min", precision = 5, scale = 2)
    private BigDecimal avgWeightMin;

    @Column(name = "avg_weight_max", precision = 5, scale = 2)
    private BigDecimal avgWeightMax;

    @Convert(converter = ActivityLevelConverter.class)
    @Column(name = "required_activity")
    private ActivityLevel requiredActivity;

    @Column(name = "coat_type", length = 10)
    private String coatType;

    @Column(name = "avg_lifespan")
    private Integer avgLifespan;

    @Column(name = "is_brachycephalic", nullable = false)
    private boolean brachycephalic;

    @Column(name = "heat_tolerance")
    private Integer heatTolerance;

    @Column(name = "cold_tolerance")
    private Integer coldTolerance;
}
