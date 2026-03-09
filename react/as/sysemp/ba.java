@GetMapping("/drm/empNo/info")
public ResponseEntity<ResponseMessage> getDrmEmpNoInfo(
        @RequestParam Long svcId,
        @RequestParam Long keyId,
        @Parameter(hidden = true) Account account) {
    try {
        if (account == null) {
            return new ResponseEntity<>(
                    new ResponseMessage(ResponseCode.UNAUTHORIZED, null, "등록정보가 없습니다", "common.backend.unauthorized"),
                    HttpStatus.UNAUTHORIZED
            );
        }

        DrmEmpNoInfoResponse response = apiDetailService.getDrmEmpNoInfo(svcId, keyId);

        return ResponseEntity.ok(
                new ResponseMessage(ResponseCode.SUCCESS, response, "정상적으로 조회되었습니다.")
        );
    } catch (RestException e) {
        return new ResponseEntity<>(
                new ResponseMessage(e.getExceptionCode(), null, e.getMessage(), e.getMessageId()),
                e.getExceptionCode().getHttpStatus()
        );
    } catch (Exception e) {
        return new ResponseEntity<>(
                new ResponseMessage(
                        ResponseCode.INTERNAL_SERVER_ERROR,
                        ExceptionUtils.getMessage(e),
                        "서버 오류가 발생하였습니다.",
                        "common.backend.internalServerError"
                ),
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}

@Getter
@Builder
public class DrmEmpNoInfoResponse {
    private String authCd;
    private String subscriptionStatus;
    private String systemEmpNo;
}

public DrmEmpNoInfoResponse getDrmEmpNoInfo(Long svcId, Long keyId) {
    String authCd = hcpApiSvcMapper.getAuthCdByKeyId(keyId);
    String subscriptionStatus = hcpApiSvcMapper.getSubscriptionStatus(svcId, keyId);
    String systemEmpNo = hcpApiSvcMapper.getSysEmpNo(svcId, keyId);

    return DrmEmpNoInfoResponse.builder()
            .authCd(authCd)
            .subscriptionStatus(subscriptionStatus)
            .systemEmpNo(systemEmpNo)
            .build();
}