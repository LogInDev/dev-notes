@Slf4j
@Service
@RequiredArgsConstructor
public class HcpApiSubService {

    private final HcpApiSubMapper hcpApiSubMapper;
    private final HcpApiSvcMapper hcpApiSvcMapper;
    private final HcpApiTokenMapper hcpApiTokenMapper;
    private final HcpApiKeySysMapper hcpApiKeySysMapper;
    private final HcpApiKeyMapper hcpApiKeyMapper;
    private final HcpApiQosService hcpApiQosService;
    private final HcpApiMyPageMapper hcpApiMyPageMapper;
    private final CommonService commonService;
    private final MyPageService myPageService;
    private final CtsService ctsService;
    private final IdmUsrTblMapper idmUsrTblMapper;
    private final AccountUtil accountUtil;

    @Value("${custom.env}")
    private String env;

    @Value("${custom.link-url}")
    private String linkUrl;

    @Value("${custom.cube-channel-id}")
    private String cubeChannelId;

    /**
     * 구독 신청
     */
    @Transactional
    public void subscribe(List<HcpApiSub> hcpApiSubList, String empNo) {
        validateSubList(hcpApiSubList);

        Map<Long, String> svcTypeCacheMap = new HashMap<>();
        Set<Long> svcIds = new HashSet<>();

        // [DRM] 중복 merge 방지용
        Set<DrmMappingTarget> drmMergeTargets = new HashSet<>();

        int mergeCnt = 0;

        for (HcpApiSub it : hcpApiSubList) {
            if (it == null) {
                continue;
            }

            Long svcId = it.getSvcId();
            if (svcId == null) {
                throw new RestException(BAD_REQUEST, "서비스 ID가 없습니다.");
            }

            svcIds.add(svcId);
            it.setEmpNo(empNo);

            String svcType = svcTypeCacheMap.computeIfAbsent(
                    svcId,
                    hcpApiSvcMapper::getHcpSvcType
            );

            if ("DRM".equalsIgnoreCase(svcType)) {
                validateDrmSubscriptionTarget(it);

                drmMergeTargets.add(new DrmMappingTarget(
                        it.getSvcId(),
                        it.getKeyId(),
                        StringUtils.trim(it.getSysEmpNo()),
                        env.toUpperCase()
                ));
            }

            int affected = hcpApiSubMapper.mergeApiSub(it);
            mergeCnt += affected;
        }

        if (mergeCnt == 0) {
            throw new RestException(BAD_REQUEST, "구독 신청된 API가 없습니다. 잘못된 요청입니다.");
        }

        // [DRM] 루프 밖에서 중복 제거 후 1회씩만 merge
        for (DrmMappingTarget target : drmMergeTargets) {
            mergeSysEmpNoMapping(target);
        }

        for (Long svcId : svcIds) {
            commonService.actionHistory(svcId, "SRE", empNo, "구독 신청이 완료되었습니다.");
        }
    }

    /**
     * 구독 승인
     */
    @Transactional
    public void confirm(List<HcpApiSub> hcpApiSubList, String empNo, Account account) throws Exception {
        validateSubList(hcpApiSubList);

        Set<Long> svcIds = new HashSet<>();
        Map<Long, String> svcTypeCacheMap = new HashMap<>();

        // [CTS] keyId 단위 중복 제거
        Set<CtsKeyTarget> ctsTargets = new HashSet<>();

        // [DRM] IF 반영 대상 중복 제거
        Set<DrmMappingTarget> drmConfirmTargets = new HashSet<>();

        int updateCnt = 0;

        for (HcpApiSub it : hcpApiSubList) {
            if (it == null) {
                continue;
            }

            it.setEmpNo(empNo);
            it.setBeforeSubStatCd("APR");

            Long svcId = it.getSvcId();
            if (svcId == null) {
                throw new RestException(BAD_REQUEST, "서비스 ID가 없습니다.");
            }

            svcIds.add(svcId);

            String svcType = svcTypeCacheMap.computeIfAbsent(
                    svcId,
                    hcpApiSvcMapper::getHcpSvcType
            );

            if ("CTS".equalsIgnoreCase(svcType)) {
                if (it.getKeyId() == null) {
                    throw new RestException(BAD_REQUEST, "CTS 승인 대상 keyId가 없습니다.");
                }
                ctsTargets.add(new CtsKeyTarget(it.getKeyId()));
            }

            if ("DRM".equalsIgnoreCase(svcType)) {
                DrmMappingTarget target = buildDrmConfirmTarget(it);
                drmConfirmTargets.add(target);

                // 승인 시 updateApiSub 전에 sub에도 sysEmpNo 세팅
                it.setSysEmpNo(target.getSysEmpNo());
            }

            int cnt = hcpApiSubMapper.updateApiSub(it);
            updateCnt += cnt;
        }

        if (updateCnt == 0) {
            throw new RestException(BAD_REQUEST, "구독 승인된 API가 없습니다. 잘못된 요청입니다.");
        }

        // [CTS] 중복 제거 후 1회씩만 구독 처리
        for (CtsKeyTarget target : ctsTargets) {
            confirmCtsSubscription(target.getKeyId());
        }

        // [DRM] 중복 제거 후 1회씩만 IF 반영
        for (DrmMappingTarget target : drmConfirmTargets) {
            updateIfApiKey(
                    HcpApiKeySys.builder()
                            .svcId(target.getSvcId())
                            .keyId(target.getKeyId())
                            .sysEmpNo(target.getSysEmpNo())
                            .svcEnv(target.getSvcEnv())
                            .build()
            );
        }

        hcpApiQosService.registApiQosWithDefaultBySub(hcpApiSubList);

        String actCd = "SPR";
        String memo = "구독 신청이 승인되었습니다";
        Long firstKeyId = hcpApiSubList.get(0).getKeyId();

        for (Long svcId : svcIds) {
            commonService.actionHistory(svcId, actCd, empNo, memo);

            String url = linkUrl + "apps/hcp-web-api-store/api/detail/" + svcId;
            Map<String, Object> hashMap = Map.of(
                    "svcId", svcId,
                    "keyId", firstKeyId,
                    "empNo", empNo
            );

            List<String> userList = hcpApiMyPageMapper.getMyRegistUserSub(hashMap);
            List<Map<String, Object>> hcpApiSvcDtl = hcpApiSvcMapper.selectSvcInfDtl(svcId);
            String serviceName = (String) hcpApiSvcDtl.get(0).get("svcNm");

            Map<String, Object> templateHashMap = new HashMap<>();
            templateHashMap.put("title", "**API Store 구독 신청 결과 알림**");
            templateHashMap.put("message", serviceName + "의 구독 신청이 승인되었습니다.");
            templateHashMap.put("message1", "API G/W 에 반영되는데 1~2분 가량 소요됩니다.");

            for (int i = 0; i < 2; i++) {
                templateHashMap.put("urlLink", url);
                if (i == 0) {
                    templateHashMap.put("userId", "");
                    templateHashMap.put("channelId", cubeChannelId);
                } else {
                    if (!userList.isEmpty()) {
                        templateHashMap.put("userId", userList.get(0));
                    } else {
                        templateHashMap.put("userId", "");
                    }
                    templateHashMap.put("channelId", "");
                }
                myPageService.notificate(templateHashMap);
            }

            commonService.workplaceNotify(
                    accountUtil.getSiteIdDefaultIfNull(account),
                    "[승인]" + serviceName + "의 구독 신청이 승인되었습니다.",
                    "[Approve]" + serviceName + " subscription approved",
                    "[Approve]" + serviceName + " subscription approved",
                    NOTI_API_DETAIL_CONTENTS, NOTI_API_DETAIL_CONTENTS, NOTI_API_DETAIL_CONTENTS,
                    "API G/W 에 반영되는데 1~2분 가량 소요됩니다.",
                    "API G/W Adapted 1~2 minutes later",
                    "API G/W Adapted 1~2 minutes later",
                    url,
                    userList
            );
        }
    }

    /**
     * 구독 해제
     */
    @Transactional
    public void unsubscribe(List<HcpApiSub> hcpApiSubList, String empNo) {
        validateSubList(hcpApiSubList);

        Map<Long, String> svcTypeCacheMap = new HashMap<>();
        Set<Long> svcIds = new HashSet<>();

        Set<CtsKeyTarget> ctsTargets = new HashSet<>();
        Set<DrmMappingTarget> drmDeleteTargets = new HashSet<>();

        int updateCnt = 0;

        for (HcpApiSub it : hcpApiSubList) {
            if (it == null) {
                continue;
            }

            it.setEmpNo(empNo);
            it.setBeforeSubStatCd("NOR");

            Long keyId = it.getKeyId();
            Long svcId = it.getSvcId();

            if (svcId == null) {
                throw new RestException(BAD_REQUEST, "서비스 ID가 없습니다.");
            }

            svcIds.add(svcId);

            String svcType = svcTypeCacheMap.computeIfAbsent(
                    svcId,
                    hcpApiSvcMapper::getHcpSvcType
            );

            if ("CTS".equalsIgnoreCase(svcType)) {
                if (keyId == null) {
                    throw new RestException(BAD_REQUEST, "CTS 해제 대상 keyId가 없습니다.");
                }
                ctsTargets.add(new CtsKeyTarget(keyId));
            }

            if ("DRM".equalsIgnoreCase(svcType)) {
                validateDrmUnsubscribeTarget(it);
                drmDeleteTargets.add(new DrmMappingTarget(
                        it.getSvcId(),
                        it.getKeyId(),
                        StringUtils.trim(it.getSysEmpNo()),
                        env.toUpperCase()
                ));
            }

            int cnt = hcpApiSubMapper.updateApiSub(it);
            updateCnt += cnt;
        }

        if (updateCnt == 0) {
            throw new RestException(BAD_REQUEST, "구독 해제된 API가 없습니다. 잘못된 요청입니다.");
        }

        // [CTS] 중복 제거 후 1회씩만 해제
        for (CtsKeyTarget target : ctsTargets) {
            unsubscribeCts(target.getKeyId());
        }

        // [DRM] 중복 제거 후 1회씩만 삭제/reset
        for (DrmMappingTarget target : drmDeleteTargets) {
            removeSysEmpNoMapping(target);
        }

        hcpApiQosService.deleteApiQosByPubIdAndKeyId(hcpApiSubList);

        for (Long svcId : svcIds) {
            commonService.actionHistory(svcId, "CCL", empNo, "구독 신청이 해제되었습니다");
        }
    }

    /**
     * 구독 승인 반려
     */
    @Transactional
    public void reject(List<HcpApiSub> hcpApiSubList, String empNo, Account account) throws Exception {
        validateSubList(hcpApiSubList);

        Map<Long, String> svcTypeCacheMap = new HashMap<>();
        Set<Long> svcIds = new HashSet<>();
        Set<DrmMappingTarget> drmDeleteTargets = new HashSet<>();

        int updateCnt = 0;

        for (HcpApiSub it : hcpApiSubList) {
            if (it == null) {
                continue;
            }

            it.setEmpNo(empNo);
            it.setBeforeSubStatCd("APR");

            Long svcId = it.getSvcId();
            if (svcId == null) {
                throw new RestException(BAD_REQUEST, "서비스 ID가 없습니다.");
            }

            String svcType = svcTypeCacheMap.computeIfAbsent(
                    svcId,
                    hcpApiSvcMapper::getHcpSvcType
            );

            if ("DRM".equalsIgnoreCase(svcType)) {
                HcpApiKeySys sysEmpNoMapping = hcpApiKeySysMapper.findSysEmpNoMapping(
                        it.getSvcId(),
                        it.getKeyId(),
                        env.toUpperCase()
                );

                if (sysEmpNoMapping != null && StringUtils.isNotBlank(sysEmpNoMapping.getSysEmpNo())) {
                    drmDeleteTargets.add(new DrmMappingTarget(
                            sysEmpNoMapping.getSvcId(),
                            sysEmpNoMapping.getKeyId(),
                            StringUtils.trim(sysEmpNoMapping.getSysEmpNo()),
                            sysEmpNoMapping.getSvcEnv()
                    ));
                }
            }

            int cnt = hcpApiSubMapper.updateApiSub(it);
            updateCnt += cnt;
            svcIds.add(svcId);
        }

        if (updateCnt == 0) {
            throw new RestException(BAD_REQUEST, "반려된 API가 없습니다. 잘못된 요청입니다.");
        }

        // [DRM] 중복 제거 후 1회씩만 삭제/reset
        for (DrmMappingTarget target : drmDeleteTargets) {
            removeSysEmpNoMapping(target);
        }

        String actCd = "SEJ";
        String memo = "구독 신청이 반려되었습니다";
        String reason = hcpApiSubList.get(0).getAprvReason();
        Long firstKeyId = hcpApiSubList.get(0).getKeyId();

        for (Long svcId : svcIds) {
            commonService.actionHistory(svcId, actCd, empNo, memo);

            Map<String, Object> hashMap = Map.of(
                    "svcId", svcId,
                    "keyId", firstKeyId,
                    "empNo", empNo
            );

            List<String> userList = hcpApiMyPageMapper.getMyRegistUserSub(hashMap);
            List<Map<String, Object>> hcpApiSvcDtl = hcpApiSvcMapper.selectSvcInfDtl(svcId);

            String serviceName = (String) hcpApiSvcDtl.get(0).get("svcNm");
            Map<String, Object> templateHashMap = new HashMap<>();
            templateHashMap.put("title", "**API Store 구독 신청 결과 알림**");
            templateHashMap.put("message", serviceName + "의 구독 신청이 반려되었습니다.");
            templateHashMap.put("message1", "반려메시지 : " + reason);

            String url = linkUrl + "apps/hcp-web-api-store/api/detail/" + svcId;
            for (int i = 0; i < 2; i++) {
                templateHashMap.put("urlLink", url);
                if (i == 0) {
                    templateHashMap.put("userId", "");
                    templateHashMap.put("channelId", cubeChannelId);
                } else {
                    if (!userList.isEmpty()) {
                        templateHashMap.put("userId", userList.get(0));
                    } else {
                        templateHashMap.put("userId", "");
                    }
                    templateHashMap.put("channelId", "");
                }
                myPageService.notificate(templateHashMap);
            }

            commonService.workplaceNotify(
                    accountUtil.getSiteIdDefaultIfNull(account),
                    "[반려]" + serviceName + "의 구독 신청이 반려되었습니다.",
                    "[Reject]" + serviceName + " subscription rejected",
                    "[Reject]" + serviceName + " subscription rejected",
                    NOTI_API_DETAIL_CONTENTS, NOTI_API_DETAIL_CONTENTS, NOTI_API_DETAIL_CONTENTS,
                    "rejectMessage  : " + reason,
                    "rejectMessage  : " + reason,
                    "rejectMessage  : " + reason,
                    url,
                    userList
            );
        }
    }

    public int selectSubAprCount(List<HcpApiSub> hcpApiSvcSubList) {
        long keyId = hcpApiSvcSubList.get(0).getKeyId();
        Set<Long> pubIds = hcpApiSvcSubList.stream()
                .map(HcpApiSub::getPubId)
                .collect(Collectors.toSet());

        return hcpApiSubMapper.selectCountByKeyIdAndPubIds(keyId, pubIds);
    }

    // =========================================================
    // private methods
    // =========================================================

    private void validateSubList(List<HcpApiSub> hcpApiSubList) {
        if (hcpApiSubList == null || hcpApiSubList.isEmpty()) {
            throw new RestException(BAD_REQUEST, "처리할 구독 정보가 없습니다.");
        }
    }

    private void confirmCtsSubscription(Long keyId) {
        CtsSubKeyInfo keyInfo = hcpApiTokenMapper.getCtsSubKeyInfo(keyId);

        if (keyInfo == null) {
            log.error("keyInfo is null - keyId : {}", keyId);
            throw new RestException(ResponseCode.BAD_REQUEST, "keyInfo is null");
        }

        try {
            boolean alreadySubscribed = ctsService.checkAlreadySubscription(keyId);
            if (!alreadySubscribed) {
                ctsService.subscriptionCts(keyInfo);
            } else {
                log.info("already subscribed cts for keyId: {}", keyId);
            }
        } catch (Exception e) {
            log.error("cts subscription error! - {}", e.getMessage(), e);
            throw new RestException(ResponseCode.INTERNAL_SERVER_ERROR, "cts subscription fail");
        }
    }

    private void unsubscribeCts(Long keyId) {
        CtsSubKeyInfo keyInfo = hcpApiTokenMapper.getCtsSubKeyInfo(keyId);

        if (keyInfo == null) {
            log.error("keyInfo is null - keyId : {}", keyId);
            throw new RestException(ResponseCode.BAD_REQUEST, "keyInfo is null");
        }

        try {
            ctsService.unSubscriptionCts(keyInfo);
        } catch (Exception e) {
            log.error("cts unsubscription error! - {}", e.getMessage(), e);
            throw new RestException(ResponseCode.INTERNAL_SERVER_ERROR, "cts subscription fail");
        }
    }

    private DrmMappingTarget buildDrmConfirmTarget(HcpApiSub sub) {
        validateDrmApprovalTarget(sub);

        HcpApiKeySys mapping = hcpApiKeySysMapper.findSysEmpNoMapping(
                sub.getSvcId(),
                sub.getKeyId(),
                env.toUpperCase()
        );

        if (mapping == null || StringUtils.isBlank(mapping.getSysEmpNo())) {
            throw new RestException(ResponseCode.BAD_REQUEST, "승인할 시스템 사번 매핑 정보가 없습니다.");
        }

        return new DrmMappingTarget(
                mapping.getSvcId(),
                mapping.getKeyId(),
                StringUtils.trim(mapping.getSysEmpNo()),
                mapping.getSvcEnv()
        );
    }

    /*
     * DRM 서비스 키 매핑 저장
     */
    private void mergeSysEmpNoMapping(DrmMappingTarget target) {
        HcpApiKeySys param = HcpApiKeySys.builder()
                .svcId(target.getSvcId())
                .keyId(target.getKeyId())
                .sysEmpNo(target.getSysEmpNo())
                .svcEnv(target.getSvcEnv())
                .build();

        try {
            int affected = hcpApiKeySysMapper.mergeSysEmpNo(param);
            if (affected <= 0) {
                throw new RestException(INTERNAL_SERVER_ERROR, "시스템 사번 매핑 저장에 실패했습니다.");
            }
        } catch (DuplicateKeyException e) {
            log.warn("중복 시스템 사번 매핑. svcId={}, keyId={}, sysEmpNo={}",
                    target.getSvcId(), target.getKeyId(), target.getSysEmpNo());
            throw new RestException(CONFLICT, "이미 등록된 시스템 사번입니다.");
        } catch (DataAccessException e) {
            log.error("시스템 사번 매핑 DB 오류. svcId={}, keyId={}, sysEmpNo={}",
                    target.getSvcId(), target.getKeyId(), target.getSysEmpNo(), e);
            throw new RestException(INTERNAL_SERVER_ERROR, "시스템 사번 매핑 처리 중 DB 오류가 발생했습니다.");
        }
    }

    private void removeSysEmpNoMapping(DrmMappingTarget target) {
        if (target == null || target.getSvcId() == null || target.getKeyId() == null || StringUtils.isBlank(target.getSysEmpNo())) {
            throw new RestException(BAD_REQUEST, "시스템 사번 매핑 삭제 대상이 올바르지 않습니다.");
        }

        try {
            resetIfApiKey(target.getSysEmpNo());

            int deleted = hcpApiKeySysMapper.deleteSysEmpNo(
                    HcpApiKeySys.builder()
                            .svcId(target.getSvcId())
                            .keyId(target.getKeyId())
                            .sysEmpNo(target.getSysEmpNo())
                            .svcEnv(target.getSvcEnv())
                            .build()
            );

            if (deleted == 0) {
                log.warn("DRM 시스템 사번 매핑 삭제 대상 없음. svcId={}, keyId={}, sysEmpNo={}",
                        target.getSvcId(), target.getKeyId(), target.getSysEmpNo());
            }

        } catch (DataAccessException e) {
            log.error("시스템 사번 매핑 삭제 실패. svcId={}, keyId={}, sysEmpNo={}",
                    target.getSvcId(), target.getKeyId(), target.getSysEmpNo(), e);
            throw new RestException(INTERNAL_SERVER_ERROR, "시스템 사번 매핑 삭제 중 DB 오류가 발생했습니다.");
        }
    }

    private void updateIfApiKey(HcpApiKeySys hcpApiKeysys) {
        if ("STG".equalsIgnoreCase(env)) {
            idmUsrTblMapper.updateIFApiKeyFromStg(hcpApiKeysys);
        } else {
            idmUsrTblMapper.updateIFApiKey(hcpApiKeysys);
        }
    }

    private void resetIfApiKey(String sysEmpNo) {
        if ("STG".equalsIgnoreCase(env)) {
            idmUsrTblMapper.deleteIFApiKeyFromStg(sysEmpNo);
        } else {
            idmUsrTblMapper.deleteIFApiKey(sysEmpNo);
        }
    }

    private void validateDrmSubscriptionTarget(HcpApiSub sub) {
        if (sub == null) {
            throw new RestException(BAD_REQUEST, "구독 정보가 없습니다.");
        }

        if (sub.getSvcId() == null || sub.getSvcId() <= 0) {
            throw new RestException(BAD_REQUEST, "서비스 ID가 유효하지 않습니다.");
        }

        if (sub.getKeyId() == null || sub.getKeyId() <= 0) {
            throw new RestException(BAD_REQUEST, "키 ID가 유효하지 않습니다.");
        }

        if (StringUtils.isBlank(sub.getSysEmpNo())) {
            throw new RestException(BAD_REQUEST, "시스템 사번이 비어 있습니다.");
        }

        HcpApiKeyAuth key = hcpApiKeyMapper.findByKeyId(sub.getKeyId());
        if (key == null) {
            throw new RestException(NOT_FOUND, "존재하지 않는 키입니다.");
        }

        if (!"PSN".equalsIgnoreCase(key.getAuthCd())) {
            throw new RestException(BAD_REQUEST, "개인 타입 키만 구독 신청할 수 있습니다.");
        }
    }

    private void validateDrmApprovalTarget(HcpApiSub sub) {
        if (sub == null) {
            throw new RestException(ResponseCode.BAD_REQUEST, "구독 승인 정보가 없습니다.");
        }

        if (sub.getSvcId() == null || sub.getSvcId() <= 0) {
            throw new RestException(ResponseCode.BAD_REQUEST, "서비스 ID가 유효하지 않습니다.");
        }

        if (sub.getKeyId() == null || sub.getKeyId() <= 0) {
            throw new RestException(ResponseCode.BAD_REQUEST, "키 ID가 유효하지 않습니다.");
        }

        HcpApiKeyAuth key = hcpApiKeyMapper.findByKeyId(sub.getKeyId());
        if (key == null) {
            throw new RestException(ResponseCode.NOT_FOUND, "존재하지 않는 키입니다.");
        }

        if (!"PSN".equalsIgnoreCase(key.getAuthCd())) {
            throw new RestException(ResponseCode.BAD_REQUEST, "개인 타입 키만 DRM 승인 처리할 수 있습니다.");
        }
    }

    private void validateDrmUnsubscribeTarget(HcpApiSub sub) {
        if (sub == null) {
            throw new RestException(BAD_REQUEST, "구독 해제 정보가 없습니다.");
        }

        if (sub.getSvcId() == null || sub.getSvcId() <= 0) {
            throw new RestException(BAD_REQUEST, "서비스 ID가 유효하지 않습니다.");
        }

        if (sub.getKeyId() == null || sub.getKeyId() <= 0) {
            throw new RestException(BAD_REQUEST, "키 ID가 유효하지 않습니다.");
        }

        if (StringUtils.isBlank(sub.getSysEmpNo())) {
            throw new RestException(BAD_REQUEST, "시스템 사번이 비어 있습니다.");
        }
    }
}


