// controller.
@Operation(
    description = "API 등록자인 경우 구독중인 모든 KeyList 조회",
    extensions = {
        @Extension(properties = @ExtensionProperty(name = "order", value = "1"))
    }
)
@GetMapping(value = "/dashboard/store/apiAllKeyList")
public ResponseEntity<ResponseMessage> apiAllKeyList(
        @Parameter(hidden = true) Account account,
        @Parameter(description = "svcId", example = "1")
        @RequestParam(name = "svcId") Long svcId
) {
    try {
        if (account == null) {
            ResponseMessage restResponse = new ResponseMessage(
                    ResponseCode.UNAUTHORIZED,
                    null,
                    "등록정보가 없습니다.",
                    "common.backend.unauthorized"
            );
            return new ResponseEntity<>(restResponse, HttpStatus.UNAUTHORIZED);
        }

        if (svcId == null || svcId <= 0) {
            ResponseMessage restResponse = new ResponseMessage(
                    ResponseCode.BAD_REQUEST,
                    null,
                    "서비스 ID가 올바르지 않습니다.",
                    "store.dashboard.invalidSvcId"
            );
            return new ResponseEntity<>(restResponse, HttpStatus.BAD_REQUEST);
        }

        String managerYN = projectService.getManagerCheck(svcId, account);

        if (!"Y".equalsIgnoreCase(managerYN)) {
            ResponseMessage restResponse = new ResponseMessage(
                    ResponseCode.FORBIDDEN,
                    null,
                    "서비스 담당자가 아닙니다.",
                    "store.dashboard.notServiceManager"
            );
            return new ResponseEntity<>(restResponse, HttpStatus.FORBIDDEN);
        }

        List<Map<String, Object>> tokenList = dashboardService.dashboardAllKeyList(svcId);

        ResponseMessage restResponse = new ResponseMessage(
                ResponseCode.SUCCESS,
                tokenList,
                "정상적으로 keyList가 출력되었습니다."
        );

        return new ResponseEntity<>(restResponse, HttpStatus.OK);

    } catch (RestException e) {
        ResponseMessage restResponse = new ResponseMessage(
                e.getExceptionCode(),
                null,
                e.getMessage(),
                e.getMessageId()
        );
        return new ResponseEntity<>(restResponse, e.getExceptionCode().getHttpStatus());

    } catch (Exception e) {
        // log.error("Failed to get all key list. svcId={}", svcId, e);

        ResponseMessage restResponse = new ResponseMessage(
                ResponseCode.INTERNAL_SERVER_ERROR,
                null,
                "서버 오류가 발생하였습니다.",
                "common.backend.internalServerError"
        );
        return new ResponseEntity<>(restResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}


// mapper
int countServiceManager(
        @Param("svcId") Long svcId,
        @Param("empNo") String empNo
);

<select id="countServiceManager" resultType="int">
    SELECT COUNT(1)
    FROM HCP_API_SVC_MNG
    WHERE SVC_ID = #{svcId}
      AND MNG_ID = #{empNo}
</select>

  //service
  public String getManagerCheck(Long svcId, Account account) {
    if (svcId == null || account == null || account.getAccountId() == null) {
        return "N";
    }

    int count = hcpApiSvcMngMapper.countServiceManager(
            svcId,
            account.getAccountId()
    );

    return count > 0 ? "Y" : "N";
}

// YN 없애고
public boolean isServiceManager(Long svcId, Account account) {
    if (svcId == null || account == null || account.getAccountId() == null) {
        return false;
    }

    return hcpApiSvcMngMapper.countServiceManager(
            svcId,
            account.getAccountId()
    ) > 0;
}

@GetMapping("/dashboard/store/apiAllKeyList")
public ResponseEntity<ResponseMessage> apiAllKeyList(
        @Parameter(hidden = true) Account account,
        @RequestParam Long svcId
) {
    if (account == null) {
        throw new RestException(
                ResponseCode.UNAUTHORIZED,
                "등록정보가 없습니다.",
                "common.backend.unauthorized"
        );
    }

    if (!projectService.isServiceManager(svcId, account)) {
        throw new RestException(
                ResponseCode.FORBIDDEN,
                "서비스 담당자가 아닙니다.",
                "store.dashboard.notServiceManager"
        );
    }

    List<DashboardKeyResponse> keyList =
            dashboardService.getDashboardAllKeyList(svcId);

    return ResponseEntity.ok(
            new ResponseMessage(
                    ResponseCode.SUCCESS,
                    keyList,
                    "정상적으로 keyList가 출력되었습니다."
            )
    );
}
