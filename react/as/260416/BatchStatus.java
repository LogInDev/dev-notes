package com.skhynix.hcp.arch.gateway.cronjob.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BatchStatus {
    WAITING("W"),
    PROCESSING("P"),
    COMPLETE("C"),
    FAIL("F");

    private final String code;
}
