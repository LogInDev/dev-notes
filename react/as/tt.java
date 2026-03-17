spring:
  application:
    name: daemon-project

scheduler:
  unsubscribe:
    cron: "0 30 7 * * *"
    zone: "Asia/Seoul"

external:
  unsubscribe:
    base-url: "http://other-project"
    path: "/api/subscription/unsubscribe"
    connect-timeout-ms: 3000
    read-timeout-ms: 5000

package com.example.daemon.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class SchedulingConfig {
}

package com.example.daemon.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate(
            RestTemplateBuilder builder,
            @Value("${external.unsubscribe.connect-timeout-ms}") int connectTimeoutMs,
            @Value("${external.unsubscribe.read-timeout-ms}") int readTimeoutMs
    ) {
        return builder
                .setConnectTimeout(Duration.ofMillis(connectTimeoutMs))
                .setReadTimeout(Duration.ofMillis(readTimeoutMs))
                .build();
    }
}

package com.example.daemon.domain;

public enum UnsubscribeProcessStatus {
    READY,
    PROCESSING,
    SUCCESS,
    FAIL
}
package com.example.daemon.client;

import com.example.daemon.client.dto.UnsubscribeRequest;
import com.example.daemon.client.dto.UnsubscribeResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Component
@RequiredArgsConstructor
public class UnsubscribeApiClient {

    private final RestTemplate restTemplate;

    @Value("${external.unsubscribe.base-url}")
    private String baseUrl;

    @Value("${external.unsubscribe.path}")
    private String path;

    public void unsubscribe(Long userId, String subscriptionId) {
        String url = baseUrl + path;

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_TYPE, "application/json");

        UnsubscribeRequest request = new UnsubscribeRequest(userId, subscriptionId);
        HttpEntity<UnsubscribeRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<UnsubscribeResponse> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                UnsubscribeResponse.class
        );

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new IllegalStateException("구독 해제 API 호출 실패. status=" + response.getStatusCode());
        }

        UnsubscribeResponse body = response.getBody();

        if (body == null) {
            throw new IllegalStateException("구독 해제 API 응답 body가 없습니다.");
        }

        if (!body.isSuccess()) {
            throw new IllegalStateException(
                    "구독 해제 API 비즈니스 실패. code=" + body.getCode() + ", message=" + body.getMessage()
            );
        }

        log.info("구독 해제 API 성공. userId={}, subscriptionId={}", userId, subscriptionId);
    }
}
package com.example.daemon.mapper;

import com.example.daemon.domain.UnsubscribeTarget;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UnsubscribeBatchMapper {

    List<UnsubscribeTarget> findReadyTargets();

    int updateStatus(@Param("id") Long id, @Param("status") String status);

    int updateStatusWithMessage(
            @Param("id") Long id,
            @Param("status") String status,
            @Param("failReason") String failReason
    );
}

<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.example.daemon.mapper.UnsubscribeBatchMapper">

    <resultMap id="unsubscribeTargetMap" type="com.example.daemon.domain.UnsubscribeTarget">
        <id property="id" column="id"/>
        <result property="userId" column="user_id"/>
        <result property="subscriptionId" column="subscription_id"/>
        <result property="status" column="status"/>
    </resultMap>

    <select id="findReadyTargets" resultMap="unsubscribeTargetMap">
        SELECT
            id,
            user_id,
            subscription_id,
            status
        FROM subscription_batch_target
        WHERE status = 'READY'
    </select>

    <update id="updateStatus">
        UPDATE subscription_batch_target
        SET
            status = #{status},
            updated_at = NOW()
        WHERE id = #{id}
    </update>

    <update id="updateStatusWithMessage">
        UPDATE subscription_batch_target
        SET
            status = #{status},
            fail_reason = #{failReason},
            updated_at = NOW()
        WHERE id = #{id}
    </update>

</mapper>
package com.example.daemon.service;

import com.example.daemon.client.UnsubscribeApiClient;
import com.example.daemon.domain.UnsubscribeProcessStatus;
import com.example.daemon.domain.UnsubscribeTarget;
import com.example.daemon.mapper.UnsubscribeBatchMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UnsubscribeBatchService {

    private final UnsubscribeBatchMapper unsubscribeBatchMapper;
    private final UnsubscribeApiClient unsubscribeApiClient;

    public void process() {
        List<UnsubscribeTarget> targets = unsubscribeBatchMapper.findReadyTargets();

        if (targets == null || targets.isEmpty()) {
            log.info("구독 해제 대상 없음");
            return;
        }

        log.info("구독 해제 대상 {}건 조회", targets.size());

        for (UnsubscribeTarget target : targets) {
            processOne(target);
        }
    }

    private void processOne(UnsubscribeTarget target) {
        Long id = target.getId();
        Long userId = target.getUserId();
        String subscriptionId = target.getSubscriptionId();

        try {
            unsubscribeBatchMapper.updateStatus(id, UnsubscribeProcessStatus.PROCESSING.name());

            unsubscribeApiClient.unsubscribe(userId, subscriptionId);

            unsubscribeBatchMapper.updateStatus(id, UnsubscribeProcessStatus.SUCCESS.name());

            log.info("구독 해제 처리 성공. id={}, userId={}, subscriptionId={}", id, userId, subscriptionId);

        } catch (Exception e) {
            String failReason = shorten(e.getMessage(), 1000);

            unsubscribeBatchMapper.updateStatusWithMessage(
                    id,
                    UnsubscribeProcessStatus.FAIL.name(),
                    failReason
            );

            log.error("구독 해제 처리 실패. id={}, userId={}, subscriptionId={}", id, userId, subscriptionId, e);
        }
    }

    private String shorten(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}


package com.example.daemon.scheduler;

import com.example.daemon.service.UnsubscribeBatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class UnsubscribeScheduler {

    private final UnsubscribeBatchService unsubscribeBatchService;

    @Scheduled(
            cron = "${scheduler.unsubscribe.cron}",
            zone = "${scheduler.unsubscribe.zone}"
    )
    public void run() {
        log.info("구독 해제 스케줄 시작");

        try {
            unsubscribeBatchService.process();
        } catch (Exception e) {
            log.error("구독 해제 스케줄 전체 실행 중 오류", e);
        }

        log.info("구독 해제 스케줄 종료");
    }
}


