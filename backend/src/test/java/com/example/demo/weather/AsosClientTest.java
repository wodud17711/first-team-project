package com.example.demo.weather;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.weather.client.AsosClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.BDDMockito.given;

@SpringBootTest
class AsosClientTest {

    @Autowired
    private AsosClient asosClient;

    @MockitoBean
    private AsosClient mockAsosClient;

    @Test
    void 지면온도_조회_성공() {

        given(mockAsosClient.fetchGroundTemp(anyDouble(), anyDouble()))
                .willReturn(25.0);

        Double temp = mockAsosClient.fetchGroundTemp(37.5, 127.0);

        assertThat(temp).isEqualTo(25.0);
    }

    @Test
    void null_응답이면_null_반환() {

        given(mockAsosClient.fetchGroundTemp(anyDouble(), anyDouble()))
                .willReturn(null);

        Double temp = mockAsosClient.fetchGroundTemp(37.5, 127.0);

        assertThat(temp).isNull();
    }
}