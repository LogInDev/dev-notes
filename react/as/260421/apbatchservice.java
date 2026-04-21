package com.skhynix.hcp.arch.gateway.cronjob.service;

import com.skhynix.hcp.arch.gateway.cronjob.dto.BatchStatus;
import com.skhynix.hcp.arch.gateway.cronjob.dto.HcpApiBatchHist;
import com.skhynix.hcp.arch.gateway.cronjob.dto.HcpApiExpiredSysEmpNo;
import com.skhynix.hcp.arch.gateway.cronjob.mapper.HcpApiSvcActHistMapper;
import com.skhynix.hcp.arch.gateway.cronjob.mapper.SysEmpNoExpiryMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApprovalExpiryBatchStatusService {

    private final SysEmpNoExpiryMapper sysEmpNoExpiryMapper;
    private final HcpApiSvcActHistMapper hcpApiSvcActHistMapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public HcpApiBatchHist startBatch(HcpApiExpiredSysEmpNo target) {
        HcpApiBatchHist batchHist = new HcpApiBatchHist();
        batchHist.setSysEmpNo(target.getSysEmpNo());

        int startInsertCnt = hcpApiSvcActHistMapper.insertStartBatchBySysEmpNo(batchHist);
        if (startInsertCnt <= 0 || batchHist.getHistId() == null) {
            throw new IllegalStateException("배치 시작 이력 저장 실패. sysEmpNo=" + target.getSysEmpNo());
        }

        target.updateBatchStatCd(BatchStatus.PROCESSING);
        int statusUpdateCnt = sysEmpNoExpiryMapper.updateBatchStatusBySysEmpNo(target);
        if (statusUpdateCnt <= 0) {
            throw new IllegalStateException("배치 상태 PROCESSING 업데이트 실패. sysEmpNo=" + target.getSysEmpNo());
        }

        return batchHist;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void completeBatch(HcpApiExpiredSysEmpNo target, HcpApiBatchHist batchHist) {
        if (batchHist != null && batchHist.getHistId() != null) {
            int histUpdateCnt = hcpApiSvcActHistMapper.updateEndBatchBySysEmpNo(batchHist);
            if (histUpdateCnt <= 0) {
                throw new IllegalStateException("배치 종료 이력 업데이트 실패. sysEmpNo=" + batchHist.getSysEmpNo());
            }
        }

        target.updateBatchStatCd(BatchStatus.COMPLETE);
        int statusUpdateCnt = sysEmpNoExpiryMapper.updateBatchStatusBySysEmpNo(target);
        if (statusUpdateCnt <= 0) {
            throw new IllegalStateException("배치 상태 COMPLETE 업데이트 실패. sysEmpNo=" + target.getSysEmpNo());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void failBatch(HcpApiExpiredSysEmpNo target, HcpApiBatchHist batchHist, Exception e) {
        try {
            if (batchHist != null && batchHist.getHistId() != null) {
                hcpApiSvcActHistMapper.updateEndBatchBySysEmpNo(batchHist);
            }

            target.updateBatchStatCd(BatchStatus.FAIL);
            sysEmpNoExpiryMapper.updateBatchStatusBySysEmpNo(target);

        } catch (Exception ex) {
            log.error("배치 실패 상태 저장 실패. sysEmpNo={}", target.getSysEmpNo(), ex);
        }
    }
}