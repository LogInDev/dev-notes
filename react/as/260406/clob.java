@Transactional(rollbackFor = Exception.class)
public void updateSvcRootKey(HcpApiSvc hcpApiSvcTemp, Account account) throws Exception {
    String empNo = commonService.getUserId(account);
    Long svcId = hcpApiSvcTemp.getSvcId();
    String newRootKey = hcpApiSvcTemp.getRootKey();

    hcpApiSvcTemp.setEmpNo(empNo);

    String oldRootKey = apiListMapper.getRootKeyBySvcId(svcId);

    if (Objects.equals(oldRootKey, newRootKey)) {
        log.info("RootKey is unchanged. svcId={}", svcId);
        return;
    }

    int updateCnt = apiListMapper.updateSvcRootKey(hcpApiSvcTemp);

    if (updateCnt == 0) {
        throw new RestException(ResponseCode.BAD_REQUEST, "Root Key가 수정되지 않았습니다.");
    }

    RootKeyDetailDTO rootKeyDetail = RootKeyDetailDTO.builder()
            .previous(oldRootKey)
            .current(newRootKey)
            .build();

    ApiActionHistoryDetail detailInfo = ApiActionHistoryDetail.builder()
            .rootKey(rootKeyDetail)
            .build();

    commonService.actionHistory(svcId, ActHistType.RDM, empNo, detailInfo);
}

if ("ADM".equals(item.get("actCd"))) {
    AllowedIpDetailDTO allowedIp = detail.getAllowedIp();

    if (allowedIp != null) {
        Set<String> added = Optional.ofNullable(allowedIp.getAdded())
                .orElse(Collections.emptySet());

        Set<String> removed = Optional.ofNullable(allowedIp.getRemoved())
                .orElse(Collections.emptySet());

        String addedStr = added.isEmpty()
                ? ""
                : "추가된 부분 : " + String.join(", ", added);

        String removedStr = removed.isEmpty()
                ? ""
                : "삭제된 부분 : " + String.join(", ", removed);

        detailInfo = Stream.of(addedStr, removedStr)
                .filter(str -> !str.isEmpty())
                .collect(Collectors.joining("\n"));
    }
}