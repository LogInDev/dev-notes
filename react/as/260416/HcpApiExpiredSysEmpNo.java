package com.skhynix.hcp.arch.gateway.cronjob.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class HcpApiExpiredSysEmpNo implements Serializable {

    private static final long serialVersionUID = 1L;

    private String sysEmpNo;
    private String batchStatCd;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public void updateBatchStatCd(BatchStatus batchStatus) {
        this.batchStatCd = batchStatus.getCode();
    }
}
