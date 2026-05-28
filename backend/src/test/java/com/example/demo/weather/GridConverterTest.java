package com.example.demo.weather;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GridConverterTest {

    @Test
    void seoul_grid_convert_success() {

        GridCoordinate result =
                GridConverter.toGrid(
                        37.5665,
                        126.9780
                );

        assertThat(result.nx()).isEqualTo(60);
        assertThat(result.ny()).isEqualTo(127);
    }

    @Test
    void busan_grid_convert_success() {

        GridCoordinate result =
                GridConverter.toGrid(
                        35.1796,
                        129.0756
                );

        assertThat(result.nx()).isEqualTo(98);
        assertThat(result.ny()).isEqualTo(76);
    }

    @Test
    void jeju_grid_convert_success() {

        GridCoordinate result =
                GridConverter.toGrid(
                        33.4996,
                        126.5312
                );

        assertThat(result.nx()).isEqualTo(53);
        assertThat(result.ny()).isEqualTo(38);
    }
}