public static final String DASHBOARD_RESOURCES_MONTH = "dashboard-resource-monthly-*";





이렇게 es 인덱스 받는데



 
IndexCoordinates index = IndexCoordinates.of(
        "dashboard-resource-monthly-*,-dashboard-resource-monthly-*_temp"
);


 dashboard-resource-monthly-2026_new_temp



이 인덱스만 안받게 하려면 어떻게 수정해?

  /**
     * Resources 할당량 리스트 조회
     *
     * @param prjIdList 프로젝트 ID LIST
     * @param searchMonth 조회 월
     */
    public List<ResourcesWithRatioEntity> findResourcesByPrjId(List<String> prjIdList, LocalDate searchMonth) {

        // 1. prj id 유효성 검사
        if (prjIdList.isEmpty()) {
            return null;
        }

        IndexCoordinates index = IndexCoordinates.of(ElasticsearchConstant.DASHBOARD_RESOURCES_MONTH);


        List<String> svcTypeList = new ArrayList<>(Arrays.asList("app","job","paas-kb"));
        // 2. es query 생성
        BoolQueryBuilder boolQuery = QueryBuilders.boolQuery()
                .must(QueryBuilders.termsQuery(ElasticsearchConstant.PRJ_ID, prjIdList))
                .must(QueryBuilders.rangeQuery(ElasticsearchConstant.LOGDATE)
                        .from(searchMonth.minusDays(1))
                        .to(searchMonth.plusDays(1))
                        .includeLower(true)
                        .includeUpper(true)
                );
        BoolQueryBuilder shouldQuery = QueryBuilders.boolQuery();

        // 정확한 값들 (terms)
        for (String type : svcTypeList) {
            shouldQuery.should(QueryBuilders.termQuery(ElasticsearchConstant.SVC_TYPE, type));
        }

        // prefix 조건 (helm*)
        shouldQuery.should(QueryBuilders.prefixQuery(ElasticsearchConstant.SVC_TYPE, "helm"));

        shouldQuery.minimumShouldMatch(1); // 최소 1개 이상 매칭

        boolQuery.must(shouldQuery); // 위 OR 조건을 필수 조건으로 포함

        NativeSearchQuery searchQuery = new NativeSearchQueryBuilder()
                .withQuery(boolQuery)
                .build();
        //  3. es search
        SearchHits<Map> hits = elasticsearchOperations.search(
                searchQuery,
                Map.class,
                index
        );

        List<Map> histsContent = hits.stream()
                .map(org.springframework.data.elasticsearch.core.SearchHit::getContent)
                .collect(Collectors.toList());

        return histsContent.stream().map(m-> objectMapper.convertValue(m, ResourcesWithRatioEntity.class)).collect(Collectors.toList());

    }
