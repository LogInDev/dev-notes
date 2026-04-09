@Transactional(rollbackFor = Exception.class)
public List<HcpApiSvcIp> saveAllowIps(Long svcId, DrmAllowIpSaveRequest requestIps, Account account) throws Exception {
    List<DrmAllowIpRequest> createdList = nullSafeList(requestIps.getCreatedList());
    List<DrmAllowIpRequest> updatedList = nullSafeList(requestIps.getUpdatedList());
    List<DrmAllowIpRequest> deletedList = nullSafeList(requestIps.getDeletedList());

    Set<String> createdIps = extractIpSet(createdList);
    Set<String> updatedNewIps = extractIpSet(updatedList);
    Set<String> deletedIps = extractIpSet(deletedList);

    List<Long> updatedIpIds = updatedList.stream()
            .map(DrmAllowIpRequest::getIpId)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

    Set<String> updatedOldIps = updatedIpIds.isEmpty()
            ? Collections.emptySet()
            : new LinkedHashSet<>(hcpApiSvcIpMapper.getAllowedIpListById(updatedIpIds));

    insertAllowIpList(svcId, createdList, account);
    updateAllowIpList(svcId, updatedList, account);
    deleteAllowIpList(svcId, deletedList);

    Set<String> addedIps = new LinkedHashSet<>();
    addedIps.addAll(createdIps);
    addedIps.addAll(updatedNewIps);

    Set<String> removedIps = new LinkedHashSet<>();
    removedIps.addAll(deletedIps);
    removedIps.addAll(updatedOldIps);

    ApiActionHistoryDetail detailInfo = buildAllowedIpHistoryDetail(addedIps, removedIps);
    if (detailInfo != null) {
        commonService.actionHistory(svcId, ActHistType.ADM, account.getAccountId(), detailInfo);
    }

    return hcpApiSvcIpMapper.getAllowedIpList(svcId);
}

private ApiActionHistoryDetail buildAllowedIpHistoryDetail(Set<String> addedIps, Set<String> removedIps) {
    if ((addedIps == null || addedIps.isEmpty()) && (removedIps == null || removedIps.isEmpty())) {
        return null;
    }

    AllowedIpDetailDTO allowedIp = AllowedIpDetailDTO.builder()
            .added(addedIps == null || addedIps.isEmpty() ? null : addedIps)
            .removed(removedIps == null || removedIps.isEmpty() ? null : removedIps)
            .build();

    return ApiActionHistoryDetail.builder()
            .allowedIp(allowedIp)
            .build();
}

private List<DrmAllowIpRequest> nullSafeList(List<DrmAllowIpRequest> list) {
    return list == null ? Collections.emptyList() : list;
}

private Set<String> extractIpSet(List<DrmAllowIpRequest> requests) {
    if (requests == null || requests.isEmpty()) {
        return Collections.emptySet();
    }

    return requests.stream()
            .map(DrmAllowIpRequest::getIp)
            .filter(StringUtils::isNotBlank)
            .collect(Collectors.toCollection(LinkedHashSet::new));
}

<select id="getAllowedIpListById" parameterType="map" resultType="string">
    SELECT IP
    FROM HCP_API_SVC_IP
    WHERE IP_ID IN
    <foreach item="ipId" collection="ipIds" open="(" separator="," close=")">
        #{ipId}
    </foreach>
</select>

Set<String> updatedOldIps = updatedIpIds.isEmpty()
        ? Collections.emptySet()
        : new HashSet<>(hcpApiSvcIpMapper.getAllowedIpListById(updatedIpIds));

