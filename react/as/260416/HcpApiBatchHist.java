package com.skhynix.hcp.arch.gateway.cronjob.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class HcpApiBatchHist implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long histId;
    private String sysEmpNo;
    private LocalDateTime startAt;
    private LocalDateTime endAt;

    public HcpApiBatchHist() {
    }

    public HcpApiBatchHist(String sysEmpNo) {
        this.sysEmpNo = sysEmpNo;
        this.startAt = LocalDateTime.now();
    }

    public void finish() {
        this.endAt = LocalDateTime.now();
    }
}
