package com.skhynix.hcp.arch.gateway.cronjob.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.Size;
import java.io.Serializable;

@Data
public class HcpApiInfo implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "API_ID", example = "1")
    private Long apiId;

    @Schema(description = "REQ_ID", example = "1")
    private Long reqId;

    @Schema(description = "PUB_ID", example = "1")
    private Long pubId;

    @Schema(description = "KEY_ID", example = "1")
    private Long keyId;

    @Schema(description = "SVC_ID", example = "1")
    private Long svcId;

    @Schema(description = "PRJ_ID", example = "1")
    private Long prjId;

    @Schema(description = "시스템 계정", example = "X9900001")
    private String sysEmpNo;

    @Size(max = 4)
    @Schema(description = "구독 상태", example = "NOR/APR/REJ/CCL")
    private String subStatCd;

    @Size(max = 3)
    @Schema(description = "history에 남길 상태", example = "REJ/SEJ/CCL")
    private String histStatCd;

    @Schema(description = "이전 구독 상태", example = "NOR/PAPR/APR")
    private String beforeSubStatCd;

    @Size(max = 255)
    @Schema(description = "승인|거부사유", example = "테스트통과")
    private String aprvReason;

    public void setUpdateParamToPermissionRej() {
        this.subStatCd = "REJ";
        this.histStatCd = "REJ";
        this.aprvReason = "시스템 계정 승인 기간 만료로 인한 구독 권한 신청 반려";
        this.beforeSubStatCd = "PAPR";
    }

    public void setUpdateParamToCancelled() {
        this.subStatCd = "CCL";
        this.histStatCd = "CCL";
        this.aprvReason = "시스템 계정 승인 기간 만료로 인한 구독 해제";
        this.beforeSubStatCd = "NOR";
    }

    public void setUpdateParamToRejected() {
        this.subStatCd = "REJ";
        this.histStatCd = "SEJ";
        this.aprvReason = "시스템 계정 승인 기간 만료로 인한 구독 신청 반려";
        this.beforeSubStatCd = "APR";
    }
}
