public int updateSubscriptionStatus(List<HcpApiInfo> apiInfos) {
    if (CollectionUtils.isEmpty(apiInfos)) {
        return 0;
    }

    List<HcpApiInfo> aprList = apiInfos.stream()
            .filter(item -> "APR".equalsIgnoreCase(item.getBeforeSubStatCd()))
            .collect(Collectors.toList());

    List<HcpApiInfo> norList = apiInfos.stream()
            .filter(item -> "NOR".equalsIgnoreCase(item.getBeforeSubStatCd()))
            .collect(Collectors.toList());

    int updateCount = 0;

    if (!CollectionUtils.isEmpty(aprList)) {
        updateCount += sysEmpNoExpiryMapper.bulkRejectSubscriptionRequest(
                aprList,
                "시스템 계정 승인 기간 만료로 인한 구독 신청 반려"
        );
    }

    if (!CollectionUtils.isEmpty(norList)) {
        updateCount += sysEmpNoExpiryMapper.bulkCancelSubscription(
                norList,
                "시스템 계정 승인 기간 만료로 인한 구독 해제"
        );
    }

    log.info("구독 상태 업데이트 완료. requestedCount={}, updatedCount={}", apiInfos.size(), updateCount);
    return updateCount;
}



<update id="bulkRejectSubscriptionRequest" parameterType="map">
    UPDATE HCP_API_SUB
    SET SUB_STAT_CD = 'REJ',
        APRV_DTTM   = SYSDATE,
        APRV_REASON = #{aprvReason},
        UPD_DTTM    = SYSDATE
    WHERE SUB_STAT_CD = 'APR'
      AND (PUB_ID, KEY_ID) IN
    <foreach collection="targets" item="item" open="(" separator="," close=")">
        (#{item.pubId}, #{item.keyId})
    </foreach>
</update>

<update id="bulkCancelSubscription" parameterType="map">
    UPDATE HCP_API_SUB
    SET SUB_STAT_CD = 'CCL',
        APRV_DTTM   = SYSDATE,
        APRV_REASON = #{aprvReason},
        UPD_DTTM    = SYSDATE
    WHERE SUB_STAT_CD = 'NOR'
      AND (PUB_ID, KEY_ID) IN
    <foreach collection="targets" item="item" open="(" separator="," close=")">
        (#{item.pubId}, #{item.keyId})
    </foreach>
</update>

public int updateReqToRejBySysEmpNo(List<HcpApiInfo> permissionReqList) {
    if (CollectionUtils.isEmpty(permissionReqList)) {
        return 0;
    }

    permissionReqList.forEach(HcpApiInfo::setUpdateParamToPermissionRej);

    return sysEmpNoExpiryMapper.updateReqToRejBySysEmpNo(
            permissionReqList,
            "REJ",
            "시스템 계정 승인 기간 만료로 인한 구독 권한 신청 반려"
    );
}

int updateReqToRejBySysEmpNo(@Param("reqList") List<HcpApiInfo> reqList,
                             @Param("reqStatCd") String reqStatCd,
                             @Param("aprvReason") String aprvReason);

<update id="updateReqToRejBySysEmpNo">
    UPDATE HCP_API_SVC_REQ
    SET REQ_STAT_CD = #{reqStatCd},
        APRV_USER_ID = NULL,
        APRV_DTTM = SYSDATE,
        APRV_REASON = #{aprvReason},
        UPD_USER_ID = NULL,
        UPD_DTTM = SYSDATE
    WHERE REQ_ID IN
    <foreach item="reqItem" collection="reqList" open="(" separator=", " close=")">
        #{reqItem.reqId}
    </foreach>
</update>

