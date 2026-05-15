public String verifySysEmpNo(Long keyId, String sysEmpNo) {
    HcpApiKeyAuth key = hcpApiKeyMapper.findByKeyId(keyId);

    // 1. 유효한 키인지
    if (key == null) {
        throw new RestException(ResponseCode.BAD_REQUEST, "INVALID_KEY");
    }

    // 2. 개인 타입 키인지
    if (!"PSN".equalsIgnoreCase(key.getAuthCd())) {
        throw new RestException(ResponseCode.BAD_REQUEST, "INVALID_KEY_TYPE");
    }

    // 3. 시스템 계정 상태 조회
    String accountStatus = idmUsrTblMapper.getSysEmpNoStatus(sysEmpNo);

    // 계정 없음: 권한 없음과 동일하게 처리
    if (accountStatus == null) {
        throw new RestException(ResponseCode.BAD_REQUEST, "NO_PERMISSION");
    }

    switch (accountStatus) {
        case "1":
            return "VALID";

        case "2":
            throw new RestException(ResponseCode.BAD_REQUEST, "LONG_TERM_UNUSED");

        case "3":
            throw new RestException(ResponseCode.BAD_REQUEST, "NO_PERMISSION");

        default:
            throw new RestException(ResponseCode.BAD_REQUEST, "INVALID_ACCOUNT_STATUS");
    }
}