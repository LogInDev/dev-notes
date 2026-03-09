 public HcpApiKeySys verifySysEmpNo(Long svcId, Long keyId, String sysEmpNo) {
        // 1. i/f 테이블에 해당 시스템 사번이 있고, status상태가 1이고 api_sys_key가 null 인지
        // 2. hcp_api_key_sys 테이블에 해당 시스템 사번이 없는지
