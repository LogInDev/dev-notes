
    /**
     * 구독 신청
     * @param hcpApiSubList
     * @param empNo
     */
    @Transactional
    public void subscribe(List<HcpApiSub> hcpApiSubList, String empNo) {
        Set<Long> svcIds = new HashSet<>();
        hcpApiSubList.forEach(it -> {
            svcIds.add(it.getSvcId());

            it.setEmpNo(empNo);

            hcpApiSubMapper.mergeApiSub(it);
        });

        // DRM 서비스 타입 구독 시 시스템 사번 매핑
        HcpApiSub hcpApiSub = hcpApiSubList.get(0);
        String svcType = hcpApiSvcMapper.getHcpSvcType(hcpApiSub.getSvcId());
        if(svcType.equals("DRM")){
            addSysEmpNoMapping(hcpApiSub);
        }

        for (Long svcId : svcIds) {
            commonService.actionHistory(svcId, "SRE", empNo, "구독 신청이 완료되었습니다.");
        }
    }

/*
    DRM 서비스 키 매핑
     */
    public int addSysEmpNoMapping(HcpApiSub hcpApiSub){
        HcpApiKeyAuth key = hcpApiKeyMapper.findByKeyId(hcpApiSub.getKeyId());

        if (key == null) {
            throw new RestException(NOT_FOUND, "존재하지 않은 키입니다.");
        }
        if (StringUtils.isBlank(hcpApiSub.getSysEmpNo())) {
            throw new RestException(BAD_REQUEST, "시스템 사원번호가 비어 있습니다.");
        }
        if (hcpApiSub.getSvcId() == null || hcpApiSub.getSvcId() <= 0) {
            throw new RestException(BAD_REQUEST, "서비스 ID가 유효하지 않습니다.");
        }

        try {
            int result = hcpApiSvcMapper.insertSysEmpNo(
                    HcpApiKeySys.builder()
                            .svcId(hcpApiSub.getSvcId())
                            .keyId(hcpApiSub.getKeyId())
                            .sysEmpNo(hcpApiSub.getSysEmpNo())
                            .build()
            );

            if (result == 0) {
                log.warn("키-시스템 사원번호 매핑 삽입 실패: keyId={}, sysEmpNo={}",
                        hcpApiSub.getKeyId(), hcpApiSub.getSysEmpNo());
                throw new RestException(INTERNAL_SERVER_ERROR, "데이터 삽입에 실패했습니다.");
            }

            return result;
        } catch (DuplicateKeyException e) {
            log.warn("중복된 키-사원번호 매핑 시도: svcId={}, keyId={}, sysEmpNo={}",
                    hcpApiSub.getSvcId(), hcpApiSub.getKeyId(), hcpApiSub.getSysEmpNo());
            throw new RestException(CONFLICT, "이미 등록된 매핑입니다.");
        } catch (DataAccessException e) {
            log.error("DB 오류로 키-사원번호 매핑 삽입 실패: {}", hcpApiSub, e);
            throw new RestException(INTERNAL_SERVER_ERROR, "시스템 오류로 처리할 수 없습니다.");
        } catch (Exception e) {
            log.error("예상치 못한 오류 발생: {}", hcpApiSub, e);
            throw new RestException(INTERNAL_SERVER_ERROR, "처리 중 오류가 발생했습니다.");
        }
    }



/* 구독 해제*/
/**
     * 구독 해제
     *
     * @param hcpApiSubList
     * @param empNo
     */
    @Transactional
    public void unsubscribe(List<HcpApiSub> hcpApiSubList, String empNo) {
        Map<Long, String> svcTypeCacheMap = Maps.newHashMap();
        Set<Long> svcIds = new HashSet<>();

        int updateCnt = 0;
        for (HcpApiSub it : hcpApiSubList) {
            it.setEmpNo(empNo);
            it.setBeforeSubStatCd("NOR");

            Long keyId = it.getKeyId();
            Long svcId = it.getSvcId();
            svcIds.add(svcId);
            String svcType = svcTypeCacheMap.computeIfAbsent(svcId, k -> hcpApiSvcMapper.getHcpSvcType(svcId));
            if ("CTS".equalsIgnoreCase(svcType)) {
                CtsSubKeyInfo keyInfo = hcpApiTokenMapper.getCtsSubKeyInfo(keyId);

                if (keyInfo == null) {
                    log.error("keyInfo is null - keyId : {}", keyId);
                    throw new RestException(ResponseCode.BAD_REQUEST, "keyInfo is null");
                }

                // 2. CTS구독 프로세스
                try {
                    ctsService.unSubscriptionCts(keyInfo);
                } catch (Exception e) {
                    log.error("cts subscription error! - {}", e.getMessage());
                    throw new RestException(ResponseCode.INTERNAL_SERVER_ERROR, "cts subscription fail");
                }
            }
            int cnt = hcpApiSubMapper.updateApiSub(it);
            updateCnt += cnt;
        }

        if( updateCnt == 0){
            throw new RestException(ResponseCode.BAD_REQUEST, "구독 해제된 API가 없습니다. 잘못된 요청입니다.");
        }
        // DRM 서비스 타입 구독 시 시스템 사번 매핑
        HcpApiSub hcpApiSub = hcpApiSubList.get(0);
        String svcType = hcpApiSvcMapper.getHcpSvcType(hcpApiSub.getSvcId());
        if(svcType.equals("DRM")){
            deleteSysEmpNoMapping(hcpApiSub);
        }
        hcpApiQosService.deleteApiQosByPubIdAndKeyId(hcpApiSubList);

        for (Long svcId : svcIds) {
            commonService.actionHistory(svcId, "CCL", empNo, "구독 신청이 해제되었습니다");
        }
    }


@Transactional
    public int deleteSysEmpNoMapping(HcpApiSub hcpApiSub){
        hcpApiSvcMapper.deleteIFApiKey(hcpApiSub.getSysEmpNo());
        return hcpApiSvcMapper.deleteSysEmpNo(hcpApiSub.getSysEmpNo());
    }


/* mapper.xml*/

 <insert id="insertSysEmpNo" parameterType="com.skhynix.hcp.svc.api.store.vo.HcpApiKeySys" >
        /* HcpApiSvcMapper.insertSysEmpNo :  HCP API SysEmpNO 정보 매핑 */

        <selectKey resultType="long" keyProperty="sysId" order="BEFORE">
            SELECT HCP_API_KEY_SYS_SEQ.NEXTVAL FROM DUAL
        </selectKey>

        INSERT INTO HCP_API_KEY_SYS
        <trim prefix="(" suffix=")" prefixOverrides=",">
            ,SYS_ID                  /* SysEmpNo ID */
            ,KEY_ID                  /* Key ID */
            ,SVC_ID                  /* API Service ID */
            ,SYS_EMP_NO              /* 시스템 사번 */
            ,SVC_ENV				 /* DEV or STG or PRD */
        </trim>
        VALUES
        <trim prefix="(" suffix=")" prefixOverrides=",">
            ,#{sysId}				/* SysEmpNo ID */
            ,#{keyId}				/* Key ID */
            ,#{svcId}				/* API Service ID */
            ,#{sysEmpNo}            /* 시스템 사번 */
            ,#{svcEnv}  			/* DEV or STG or PRD */
        </trim>
    </insert>

    <!-- HCP API SysEmpNo 매핑 정보 삭제 -->
    <delete id="deleteSysEmpNo" parameterType="String">
        DELETE /* HcpApiSvcMapper.deleteSysEmpNo : HCP API SysEmpNo 매핑 정보 삭제 */
        FROM HCP_API_KEY_SYS
        WHERE
            SYS_EMP_NO = #{sysEmpNo}
          AND
            SVC_ENV = '${hcp.application.env}'
    </delete>

    <!-- HCP API 서비스 정보 수정 -->
    <update id="deleteIFApiKey" parameterType="String" >
        /* HcpApiSvcMapper.deleteIFApiKey : I/F 테이블 Key 정보 리셋 */
        UPDATE
            <if test="${hcp.application.env} == STG">
                IDM_USR_TBL_STG
            </if>
            <if test="${hcp.application.env} != STG">
                IDM_USR_TBL
            </if>
        SET
            KEY_ID = null,
            API_STORE_KEY = null
        WHERE
            ACCOUNT = #{sysEmpNo}
    </update>

