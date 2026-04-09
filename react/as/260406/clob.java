
    public List<HcpApiSvcIp> saveAllowIps(Long svcId, DrmAllowIpSaveRequest requestIps, Account account) throws Exception {
        insertAllowIpList(svcId, requestIps.getCreatedList(), account);

        updateAllowIpList(svcId, requestIps.getUpdatedList(), account);

        deleteAllowIpList(svcId, requestIps.getDeletedList());

        Set<String> added = Set.of(
                requestIps.getCreatedList().stream()
                        .map(DrmAllowIpRequest::getIp).collect(Collectors.toSet()).toString(),
                requestIps.getUpdatedList().stream()
                        .map(DrmAllowIpRequest::getIp).collect(Collectors.toSet()).toString()
                );
        List<Long> updatedIpIds = requestIps.getUpdatedList().stream()
                .map(DrmAllowIpRequest::getIpId).collect(Collectors.toList());
        Set<String> updatedIps = new HashSet<>(hcpApiSvcIpMapper.getAllowedIpListById(updatedIpIds));
        Set<String> removed = Set.of(
                requestIps.getDeletedList().stream()
                .map(DrmAllowIpRequest::getIp).collect(Collectors.toSet()).toString(), updatedIps.toString());

        AllowedIpDetailDTO allowedIp = AllowedIpDetailDTO.builder()
                .added(added)
                .removed(removed)
                .build();
        ApiActionHistoryDetail detailInfo = ApiActionHistoryDetail.builder()
                .keyList(null)
                .allowedIp(allowedIp)
                .rootKey(null)
                .build();

        commonService.actionHistory(svcId, ActHistType.ADM, account.getAccountId(), detailInfo);

        return hcpApiSvcIpMapper.getAllowedIpList(svcId);
    }



    <select id="getAllowedIpListById" resultType="String">
        SELECT IP
        FROM HCP_API_SVC_IP
        WHERE 0=1
        <if test="ipIds != null and ipIds.size() > 0">
            OR IP_ID IN
            <foreach item="ipId" collection="ipIds" open="(" separator="," close=")">
                #{ipId}
            </foreach>
        </if>
    </select>
