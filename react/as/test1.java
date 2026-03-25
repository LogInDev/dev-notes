public static final String IF_TABLENAME = "IDM_USR_TBL";

    @Value("${hcp.application.env}")
    private String env;

    @Value("${hcp.svc.api-store.sub-url}")
    private String hcpSvcApiStoreUrl;

    private final ApiGatewayService apiGatewayService;

    private final HcpApiQosMapper hcpApiQosMapper;
    private final SysEmpNoExpiryMapper sysEmpNoExpiryMapper;
    private final HcpApiSvcActHistMapper hcpApiSvcActHistMapper;

    public void sysEmpNoExpiryCheckProcess() {
        // 1. I/F 테이블의 key_id 컬럼 값이 null이 아니고 account_status가 1이 아닌 데이터 조회
        List<String> expiredSysEmpNoList = sysEmpNoExpiryMapper.getExpiredSysEmpNoByAccountStatus(
                getTableNameForEnvironment(IF_TABLENAME));

        log.info("승인 기간 만료된 시스템 사번 : {}", expiredSysEmpNoList.toString());

        // 2. 조회 결과가 있는 경우 후 처리 진행
        if(!CollectionUtils.isEmpty(expiredSysEmpNoList)){
            unsubscribeDrm(expiredSysEmpNoList);
        }

    }

    @Transactional
    public void unsubscribeDrm(List<String> sysEmpNoList) {
        List<HcpApiInfo> apiInfoBySysEmpNoList = sysEmpNoExpiryMapper.getApiInfoBySysEmpNo(sysEmpNoList);

        int updateCnt = 0;
        for (HcpApiInfo hcpApiInfo : apiInfoBySysEmpNoList) {
            System.out.println("apiInfoBySysEmpNoList = " + hcpApiInfo.toString());

            // 업데이트 시 업데이트한 유저 및 승인 유저 란에 'G/W' 로 적용할 것인가?
            hcpApiInfo.setUpdateParamToCancelled();
            updateCnt += sysEmpNoExpiryMapper.updateApiSub(hcpApiInfo);
        }
        // 1-1. 업데이트 된 Cnt 값 없음...? 구독 해제된 시스템 사번이 없음. 잘못된 param? -> 예외 처리...?
        log.info("{}건 업데이트 완료", updateCnt);

        int ifDeleteCnt = sysEmpNoExpiryMapper.deleteIFApiKey(getTableNameForEnvironment(IF_TABLENAME), sysEmpNoList);
        log.info("HCP_API_KEY_SYS 테이블 {}건 삭제 완료", ifDeleteCnt);
        int keySysDeleteCnt = sysEmpNoExpiryMapper.deleteSysEmpNo(apiInfoBySysEmpNoList, env.toUpperCase());
        log.info("IDM_USR_TBL({}) 테이블 {}건 삭제 완료", env.toUpperCase(), keySysDeleteCnt);

        int qosDeleteCnt = hcpApiQosMapper.deleteApiQos(apiInfoBySysEmpNoList);
        log.info("HCP_API_QOS 테이블 {}건 삭제 완료", qosDeleteCnt);

        actionHistory(apiInfoBySysEmpNoList, "시스템 사번 승인 기간 만료로 구독이 해제되었습니다.");

        apiGatewayService.addGatewayPolicyMsg();

        // 7. 구독 해제 알림
    }

    public void actionHistory(List<HcpApiInfo> apiInfoBySysEmpNoList, String memo) {
        List<HcpApiSvcActHist> actionHistoryList = apiInfoBySysEmpNoList.stream()
                .map(apiInfo -> HcpApiSvcActHist.builder()
                        .svcId(apiInfo.getSvcId())
                        .actCd(apiInfo.getSubStatCd())
                        .memo(memo)
                        .build())
                .collect(Collectors.toList());

        int insertCnt = hcpApiSvcActHistMapper.insertApiSvcActHist(actionHistoryList);
        log.info("HCP_API_SVC_ACT_HIST 테이블 {}건 삽입 완료", insertCnt);
    }

    private String getTableNameForEnvironment(String tablename) {
        return "STG".equalsIgnoreCase(env) ? tablename + "_STG" : tablename;
    }
