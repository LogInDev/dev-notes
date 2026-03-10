
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
