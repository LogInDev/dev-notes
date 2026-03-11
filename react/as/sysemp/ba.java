@Operation(description = "허용 IP 변경사항 저장")
@PostMapping("/allowIps/save")
public ResponseEntity<ResponseMessage> saveAllowIps(
        @RequestBody DrmAllowIpSaveRequest request,
        @Parameter(hidden = true) Account account) {

    try {
        if (request == null) {
            return new ResponseEntity<>(
                    new ResponseMessage(ResponseCode.BAD_REQUEST, null, "요청 데이터가 없습니다."),
                    HttpStatus.BAD_REQUEST
            );
        }

        Long svcId = request.getSvcId();
        if (svcId == null) {
            return new ResponseEntity<>(
                    new ResponseMessage(ResponseCode.BAD_REQUEST, null, "svcId는 필수입니다."),
                    HttpStatus.BAD_REQUEST
            );
        }

        List<DrmAllowIpCreateRequest> createdList =
                request.getCreatedList() == null ? Collections.emptyList() : request.getCreatedList();
        List<DrmAllowIpUpdateRequest> updatedList =
                request.getUpdatedList() == null ? Collections.emptyList() : request.getUpdatedList();
        List<DrmAllowIpDeleteRequest> deletedList =
                request.getDeletedList() == null ? Collections.emptyList() : request.getDeletedList();

        if (createdList.isEmpty() && updatedList.isEmpty() && deletedList.isEmpty()) {
            return new ResponseEntity<>(
                    new ResponseMessage(ResponseCode.BAD_REQUEST, null, "변경된 데이터가 없습니다."),
                    HttpStatus.BAD_REQUEST
            );
        }

        String authList = commonService.checkAuthenticate(svcId);
        String authListDecode = authList == null
                ? ""
                : new String(Base64.getDecoder().decode(authList), "UTF-8");

        String empNo = commonService.getUserId(account);
        String adminCheckYn = projectService.getAdminCheck(account);

        boolean hasPermission =
                authListDecode.contains(empNo) || "Y".equals(adminCheckYn);

        if (!hasPermission) {
            return new ResponseEntity<>(
                    new ResponseMessage(ResponseCode.FORBIDDEN, null, "권한이 없습니다."),
                    HttpStatus.FORBIDDEN
            );
        }

        Object result = apiDetailService.saveAllowIps(svcId, createdList, updatedList, deletedList, account);

        return new ResponseEntity<>(
                new ResponseMessage(ResponseCode.SUCCESS, result, "허용 IP가 정상적으로 저장되었습니다."),
                HttpStatus.OK
        );

    } catch (RestException e) {
        return new ResponseEntity<>(
                new ResponseMessage(e.getExceptionCode(), null, e.getMessage(), e.getMessageId()),
                e.getExceptionCode().getHttpStatus()
        );
    } catch (Exception e) {
        return new ResponseEntity<>(
                new ResponseMessage(
                        ResponseCode.INTERNAL_SERVER_ERROR,
                        ExceptionUtils.getMessage(e),
                        "서버 오류가 발생하였습니다.",
                        "common.backend.internalServerError"
                ),
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}

@Transactional
public List<HcpApiSvcIp> saveAllowIps(
        Long svcId,
        List<DrmAllowIpCreateRequest> createdList,
        List<DrmAllowIpUpdateRequest> updatedList,
        List<DrmAllowIpDeleteRequest> deletedList,
        Account account
) {
    // 1. 삭제
    for (DrmAllowIpDeleteRequest item : deletedList) {
        if (item == null || item.getIpId() == null) {
            continue;
        }
        mapper.deleteAllowIp(svcId, item.getIpId());
    }

    // 2. 수정
    for (DrmAllowIpUpdateRequest item : updatedList) {
        if (item == null || item.getIpId() == null || item.getIp() == null) {
            continue;
        }

        String ip = item.getIp().trim();
        validateIp(ip);

        mapper.updateAllowIp(svcId, item.getIpId(), ip);
    }

    // 3. 추가
    for (DrmAllowIpCreateRequest item : createdList) {
        if (item == null || item.getIp() == null) {
            continue;
        }

        String ip = item.getIp().trim();
        validateIp(ip);

        mapper.insertAllowIp(svcId, ip, commonService.getUserId(account));
    }

    // 4. 최종 목록 반환
    return mapper.selectAllowIpList(svcId);
}


