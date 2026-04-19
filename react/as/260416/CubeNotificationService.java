package com.skhynix.hcp.arch.gateway.cronjob.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CubeNotificationService {

    private static final String TEMPLATE_CUBE_PATH = "/template/cube-noti/cubeApproveDelete.ftl";

    private final RestTemplate restTemplate;

    @Value("${cube.url}")
    private String cubeUrl;

    @Value("${cube.token}")
    private String cubeToken;

    @Value("${cube.from}")
    private String cubeFrom;

    public void notificate(Map<String, Object> templateHashMap) throws Exception {
        notificate(TEMPLATE_CUBE_PATH, templateHashMap);
    }

    public void notificate(String templatePath, Map<String, Object> templateHashMap) throws Exception {
        templateHashMap.put("from", cubeFrom);
        templateHashMap.put("token", cubeToken);

        String requestBody = TemplateProcessor.process(
                getClass().getResource(templatePath),
                templateHashMap
        );

        executeCubeRestApi(requestBody);
    }

    public void executeCubeRestApi(String requestBody) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("Authorization", cubeToken);

        HttpEntity<String> requestEntity = new HttpEntity<>(requestBody, headers);
        restTemplate.postForEntity(new URI(cubeUrl), requestEntity, String.class);
    }
}
