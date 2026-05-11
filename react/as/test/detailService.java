@Slf4j
@Service
@RequiredArgsConstructor
public class ApprovalExpiryBatchService {

    @Value("${hcp.application.env}")
    private String env;

    private final ExpiryProcessService expiryProcessService;

    public void sysEmpNoExpiryProcess() {
        List<HcpApiExpiredSysEmpNo> targets = expiryProcessService.prepareExpiryTargets();

        log.info("승인 기간 만료 처리할 시스템 계정 {}건 조회. env={}, targets={}",
                targets.size(), env, targets);

        expiryProcessService.refreshIfSnapshot();

        if (CollectionUtils.isEmpty(targets)) {
            return;
        }

        for (HcpApiExpiredSysEmpNo target : targets) {
            try {
                processOneTarget(target);
            } catch (Exception e) {
                log.error("시스템 계정 승인 기간 만료 처리 실패. sysEmpNo={}", target.getSysEmpNo(), e);
            }
        }
    }

    private void processOneTarget(HcpApiExpiredSysEmpNo target) {
        // 기존 processOneTarget 유지
        // P 시작, DB 처리, OPA/Cube, C/F 마감
    }

      private final SysEmpNoExpiryMapper sysEmpNoExpiryMapper;

    @Transactional
    public List<HcpApiExpiredSysEmpNo> prepareExpiryTargets() {
        // 1. 현재 IDM_USR_TBL에 다시 존재하는 계정은 만료 관리 테이블에서 제거
        int deleteCnt = sysEmpNoExpiryMapper.deleteUnexpired();
        log.info("만료 관리 테이블에서 복구된 시스템 계정 제거 완료. deleteCount={}", deleteCnt);

        // 2. 이전 스냅샷에는 있는데 현재 원본에는 없는 계정 조회
        List<String> expiredSysEmpNos = sysEmpNoExpiryMapper.getExpiredSysEmpNo();
        if (CollectionUtils.isEmpty(expiredSysEmpNos)) {
            return Collections.emptyList();
        }

        // 3. Expired 관리 테이블에 W 상태로 적재
        int insertCnt = sysEmpNoExpiryMapper.insertExpirySysEmpNosIfNotExists(expiredSysEmpNos);
        log.info("만료 시스템 계정 적재 완료. targetCount={}, insertCount={}",
                expiredSysEmpNos.size(), insertCnt);

        // 4. 처리 대상 조회
        return sysEmpNoExpiryMapper.getProcessTargetExpirySysEmpNos();
    }

    /**
     * TRUNCATE는 DDL이라 트랜잭션 롤백이 안 됨.
     * 가능하면 DELETE + INSERT를 추천.
     */
    @Transactional
    public void refreshIfSnapshot() {
        int deleteCnt = sysEmpNoExpiryMapper.deleteIfSnapshot();
        log.info("HCP_IDM_USR_TBL 스냅샷 삭제 완료. deleteCount={}", deleteCnt);

        int insertCnt = sysEmpNoExpiryMapper.insertIfSnapshot();
        log.info("HCP_IDM_USR_TBL 스냅샷 갱신 완료. insertCount={}", insertCnt);
    }
}
