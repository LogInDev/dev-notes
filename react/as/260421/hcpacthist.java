import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import javax.validation.constraints.Size;
import java.io.Serializable;

@Data
@RequiredArgsConstructor
public class HcpApiSvcActHist implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "Action ID")
    private Long actId;

    @Schema(description = "서비스 ID")
    private Long svcId;

    @Size(max = 3)
    @Schema(description = "Action Code")
    private String actCd;

    @Size(max = 50)
    @Schema(description = "사번")
    private String empNo;

    @Size(max = 300)
    @Schema(description = "메모")
    private String memo;

    @Schema(description = "상세정보", example = "{\"keyList\":[{\"keyId\":733,\"keyName\":\"test-key\"}]}")
    private String detail;

    @Builder
    public HcpApiSvcActHist(Long svcId, String actCd, String empNo, String memo, String detail) {
        this.svcId = svcId;
        this.actCd = actCd;
        this.empNo = empNo;
        this.memo = memo;
        this.detail = detail;
    }
}