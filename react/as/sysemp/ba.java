public VerifySysEmpNoResult verifySysEmpNo(Long svcId, Long keyId, String sysEmpNo) {
    HcpApiKey key = hcpApiKeyMapper.findByKeyId(keyId);
    if (key == null) {
        throw new RestException(...);
    }

    if (!"SYS".equals(key.getAuthCd())) {
        return VerifySysEmpNoResult.builder()
                .sysEmpNo(sysEmpNo)
                .status("INVALID_KEY_TYPE")
                .build();
    }

    if (hcpApiKeySysMapper.countValidSysEmpNoFromIf(sysEmpNo) == 0) {
        return VerifySysEmpNoResult.builder()
                .sysEmpNo(sysEmpNo)
                .status("INVALID")
                .build();
    }

    if (hcpApiKeySysMapper.countDuplicatedSysEmpNo(svcId, keyId, sysEmpNo) > 0) {
        return VerifySysEmpNoResult.builder()
                .sysEmpNo(sysEmpNo)
                .status("DUPLICATED")
                .build();
    }

    return VerifySysEmpNoResult.builder()
            .sysEmpNo(sysEmpNo)
            .status("VALID")
            .build();
}




// mapper
int countValidSysEmpNoFromIf(@Param("sysEmpNo") String sysEmpNo);

int countDuplicatedSysEmpNo(
        @Param("svcId") Long svcId,
        @Param("keyId") Long keyId,
        @Param("sysEmpNo") String sysEmpNo
);

// sql
SELECT COUNT(1)
FROM IF_SYS_EMP
WHERE SYS_EMP_NO = #{sysEmpNo}
  AND STATUS = 1
  AND API_SYS_KEY IS NULL

SELECT COUNT(1)
FROM HCP_API_KEY_SYS
WHERE SYS_EMP_NO = #{sysEmpNo}
  AND NOT (SVC_ID = #{svcId} AND KEY_ID = #{keyId})



