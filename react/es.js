@Override
public List<ResourcesResponse> getResourcesList(Layout layout, ResourcesRequest request)  {

    // 1. result 객체 생성
    List<ResourcesResponse> result = new ArrayList<>();

    // 2. searchParam check
    List<String> searchParam = this.validSearchParam(request.getSearchParam());

    // 3. 메트릭 조회 및 셋팅을 위한 객체 생성
    List<String> prjIdList = this.getPrjIdList(layout, searchParam);
    List<Map<String, String>> prjObjList = this.getPrjObjList(prjIdList);
    List<ResourcesWithRatioEntity> metricList;
    LocalDate date = request.getSearchMonth().atDay(1);

    // 4. metric 조회 및 result data 셋팅
    if (!prjIdList.isEmpty()) {
        metricList = elasticsearchRepository.findResourcesByPrjId(prjIdList, date);

        for (ResourcesWithRatioEntity metric : metricList) {
            if (metric != null && metric.getLabel() != null) {

                ResourcesResponse responseData = new ResourcesResponse();

                String prjCat = prjObjList.stream()
                        .filter(prj -> prj.get("prjId").equals(metric.getLabel().getPrjId()))
                        .map(prj -> prj.get("prjCat"))
                        .findFirst()
                        .orElse(null);

                responseData.setPrjCat(prjCat);
                responseData.setRunStatus(metric.getEvent() != null ? "RUNNING" : "");
                responseData.setRscId(metric.getLabel().getRscId());
                responseData.setSvcType(metric.getLabel().getSvcType());
                responseData.setAccount("");
                responseData.setSystem("");
                responseData.setEnv(metric.getLabel().getEnv());
                responseData.setLocId(metric.getLabel().getLocId());
                responseData.setTarget(metric.getLabel().getTarget());
                responseData.setProject(metric.getLabel().getPrjId());

                // ✅ GPU: gpu_count가 없으면 GPU 없음 → gpu=null 로 내려줌 (NPE 방지)
                responseData.setGpu(toGpuQuotaOrNull(metric));

                // CPU
                responseData.setCpu(new ResourcesWithRatioQuota(
                        metric.getDb() != null ? metric.getDb().getCpuLimitCores() : 0,
                        metric.getCpuAllocatedUsageCores(),
                        (metric.getDb() != null ? metric.getDb().getCpuLimitCores() : 0) == 0
                                ? 0
                                : Double.parseDouble(String.format("%.2f",
                                        metric.getCpuRequestCores() * 100 / metric.getDb().getCpuLimitCores())),
                        metric.getCpuAllocatedUsagePercent(),
                        metric.getCpuCount().getUsage5(),
                        metric.getCpuCount().getUsage10(),
                        metric.getCpuCount().getUsage15(),
                        metric.getCpuCount().getUsage20(),
                        metric.getCpuCount().getUsage25(),
                        metric.getCpuCount().getUsage30(),
                        metric.getCpuCount().getUsage35(),
                        metric.getCpuCount().getUsage40(),
                        metric.getCpuCount().getUsage45(),
                        metric.getCpuCount().getUsage50(),
                        metric.getCpuCount().getUsage55(),
                        metric.getCpuCount().getUsage60(),
                        metric.getCpuCount().getUsage65(),
                        metric.getCpuCount().getUsage70(),
                        metric.getCpuCount().getUsage75(),
                        metric.getCpuCount().getUsage80(),
                        metric.getCpuCount().getUsage85(),
                        metric.getCpuCount().getUsage90(),
                        metric.getCpuCount().getUsage95(),
                        metric.getCpuCount().getUsage100()
                ));

                // Memory
                responseData.setMemory(new ResourcesWithRatioQuota(
                        metric.getDb() != null ? metric.getDb().getMemoryLimitBytes() : 0,
                        metric.getMemoryAllocatedUsageBytes(),
                        (metric.getDb() != null ? metric.getDb().getMemoryLimitBytes() : 0) == 0
                                ? 0
                                : Double.parseDouble(String.format("%.2f",
                                        metric.getMemoryRequestBytes() * 100 / metric.getDb().getMemoryLimitBytes())),
                        metric.getMemoryAllocatedUsagePercent(),
                        metric.getMemoryCount().getUsage5(),
                        metric.getMemoryCount().getUsage10(),
                        metric.getMemoryCount().getUsage15(),
                        metric.getMemoryCount().getUsage20(),
                        metric.getMemoryCount().getUsage25(),
                        metric.getMemoryCount().getUsage30(),
                        metric.getMemoryCount().getUsage35(),
                        metric.getMemoryCount().getUsage40(),
                        metric.getMemoryCount().getUsage45(),
                        metric.getMemoryCount().getUsage50(),
                        metric.getMemoryCount().getUsage55(),
                        metric.getMemoryCount().getUsage60(),
                        metric.getMemoryCount().getUsage65(),
                        metric.getMemoryCount().getUsage70(),
                        metric.getMemoryCount().getUsage75(),
                        metric.getMemoryCount().getUsage80(),
                        metric.getMemoryCount().getUsage85(),
                        metric.getMemoryCount().getUsage90(),
                        metric.getMemoryCount().getUsage95(),
                        metric.getMemoryCount().getUsage100()
                ));

                result.add(responseData);
            }
        }
    }

    return result;
}

/**
 * ✅ 규칙: gpu_count가 없으면 "GPU 없음"으로 판단 → null 반환
 * - GPU 있음 + 사용량 0인 경우: gpu_count가 존재하고 값들이 0이므로 객체는 생성됨
 */
private ResourcesWithRatioQuota toGpuQuotaOrNull(ResourcesWithRatioEntity metric) {
    if (metric == null || metric.getGpuCount() == null) {
        return null;
    }

    // gpuLimit: db.gpu_limit_devices가 있을 수도/없을 수도 → null-safe
    double gpuLimit = 0.0;
    if (metric.getDb() != null && metric.getDb().getGpuLimitDevices() != null) {
        gpuLimit = metric.getDb().getGpuLimitDevices();
    }

    // 아래 두 값은 현재 코드 기준 primitive일 가능성이 높아서 그대로 사용
    double gpuRequest = metric.getGpuRequestDevices();
    double gpuAllocatedUsagePercent = metric.getGpuAllocatedUsagePercent();

    double requestRatio = (gpuLimit == 0.0)
            ? 0.0
            : Double.parseDouble(String.format("%.2f", gpuRequest * 100 / gpuLimit));

    return new ResourcesWithRatioQuota(
            gpuLimit,
            gpuRequest,
            requestRatio,
            gpuAllocatedUsagePercent,
            metric.getGpuCount().getUsage5(),
            metric.getGpuCount().getUsage10(),
            metric.getGpuCount().getUsage15(),
            metric.getGpuCount().getUsage20(),
            metric.getGpuCount().getUsage25(),
            metric.getGpuCount().getUsage30(),
            metric.getGpuCount().getUsage35(),
            metric.getGpuCount().getUsage40(),
            metric.getGpuCount().getUsage45(),
            metric.getGpuCount().getUsage50(),
            metric.getGpuCount().getUsage55(),
            metric.getGpuCount().getUsage60(),
            metric.getGpuCount().getUsage65(),
            metric.getGpuCount().getUsage70(),
            metric.getGpuCount().getUsage75(),
            metric.getGpuCount().getUsage80(),
            metric.getGpuCount().getUsage85(),
            metric.getGpuCount().getUsage90(),
            metric.getGpuCount().getUsage95(),
            metric.getGpuCount().getUsage100()
    );
}