아니 쿼리결과는  아래처럼나와 gpu 없는 경우. gpu있는 경우는 gpucount도 다나오고

{
  "took" : 10,
  "timed_out" : false,
  "_shards" : {
    "total" : 3,
    "successful" : 3,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 10000,
      "relation" : "gte"
    },
    "max_score" : null,
    "hits" : [
      {
        "_index" : "dashboard-resource-monthly-2026_new_temp",
        "_type" : "_doc",
        "_id" : "K1C4S5wBLBgxzfZ9RIi4",
        "_score" : null,
        "_source" : {
          "cpu_allocated_usage_cores" : 0.0,
          "memory_allocated_usage_percent" : 0.0,
          "cpu_request_cores" : 0.0,
          "label" : {
            "rscId" : "123",
            "namespace" : "123",
            "svcType" : "app",
            "prjId" : "123",
            "env" : "dev",
            "locId" : "null",
            "target" : "1"
          },
          "memory_limit_bytes" : 0,
          "cpu_count" : {
            "usage_20_to_25" : 0,
            "usage_25_to_30" : 0,
            "usage_10_to_15" : 0,
            "usage_35_to_40" : 0,
            "usage_40_to_45" : 0,
            "usage_15_to_20" : 0,
            "usage_30_to_35" : 0,
            "usage_5_to_10" : 0,
            "usage_70_to_75" : 0,
            "usage_75_to_80" : 0,
            "usage_65_to_70" : 0,
            "usage_80_to_85" : 0,
            "usage_60_to_65" : 0,
            "usage_0_to_5" : 0,
            "usage_50_to_55" : 0,
            "usage_45_to_50" : 0,
            "usage_90_to_95" : 0,
            "usage_95_to_100" : 0,
            "usage_55_to_60" : 0,
            "usage_85_to_90" : 0
          },
          "@timestamp" : "2026-02-11T17:01:30.583+0900",
          "cpu_allocated_usage_percent" : 0.0,
          "time_range" : {
            "start" : "2026-02-01T00:00:00.000+0900",
            "end" : "2026-03-01T00:00:00.000+0900"
          },
          "logdate" : "2026-02-01T00:00:00.000+0900",
          "cpu_limit_cores" : 0.0,
          "memory_allocated_usage_bytes" : 0,
          "memory_count" : {
            "usage_20_to_25" : 0,
            "usage_25_to_30" : 0,
            "usage_10_to_15" : 0,
            "usage_35_to_40" : 0,
            "usage_40_to_45" : 0,
            "usage_15_to_20" : 0,
            "usage_30_to_35" : 0,
            "usage_5_to_10" : 0,
            "usage_70_to_75" : 0,
            "usage_75_to_80" : 0,
            "usage_65_to_70" : 0,
            "usage_80_to_85" : 0,
            "usage_60_to_65" : 0,
            "usage_0_to_5" : 0,
            "usage_50_to_55" : 0,
            "usage_45_to_50" : 0,
            "usage_90_to_95" : 0,
            "usage_95_to_100" : 0,
            "usage_55_to_60" : 0,
            "usage_85_to_90" : 0
          },
          "memory_request_bytes" : 0,
          "db" : {
            "cpu_limit_cores" : 0.10000000149011612,
            "gpu_limit_devices" : 0.0,
            "memory_limit_bytes" : 134217728
          }
        },
        "sort" : [
          "app"
        ]
      },
      {
        "_index" : "dashboard-resource-monthly-2026_new_temp",
        "_type" : "_doc",
        "_id" : "LFC4S5wBLBgxzfZ9RIi4",
        "_score" : null,
        "_source" : {
          "cpu_allocated_usage_cores" : 0.0,
          "memory_allocated_usage_percent" : 0.0,
          "cpu_request_cores" : 0.0,
          "label" : {
            "rscId" : "123",
            "namespace" : "123",
            "svcType" : "app",
            "prjId" : "123",
            "env" : "prd",
            "locId" : "null",
            "target" : "1"
          },
          "memory_limit_bytes" : 0,
          "cpu_count" : {
            "usage_20_to_25" : 0,
            "usage_25_to_30" : 0,
            "usage_10_to_15" : 0,
            "usage_35_to_40" : 0,
            "usage_40_to_45" : 0,
            "usage_15_to_20" : 0,
            "usage_30_to_35" : 0,
            "usage_5_to_10" : 0,
            "usage_70_to_75" : 0,
            "usage_75_to_80" : 0,
            "usage_65_to_70" : 0,
            "usage_80_to_85" : 0,
            "usage_60_to_65" : 0,
            "usage_0_to_5" : 0,
            "usage_50_to_55" : 0,
            "usage_45_to_50" : 0,
            "usage_90_to_95" : 0,
            "usage_95_to_100" : 0,
            "usage_55_to_60" : 0,
            "usage_85_to_90" : 0
          },
          "@timestamp" : "2026-02-11T17:01:30.584+0900",
          "cpu_allocated_usage_percent" : 0.0,
          "time_range" : {
            "start" : "2026-02-01T00:00:00.000+0900",
            "end" : "2026-03-01T00:00:00.000+0900"
          },
          "logdate" : "2026-02-01T00:00:00.000+0900",
          "cpu_limit_cores" : 0.0,
          "memory_allocated_usage_bytes" : 0,
          "memory_count" : {
            "usage_20_to_25" : 0,
            "usage_25_to_30" : 0,
            "usage_10_to_15" : 0,
            "usage_35_to_40" : 0,
            "usage_40_to_45" : 0,
            "usage_15_to_20" : 0,
            "usage_30_to_35" : 0,
            "usage_5_to_10" : 0,
            "usage_70_to_75" : 0,
            "usage_75_to_80" : 0,
            "usage_65_to_70" : 0,
            "usage_80_to_85" : 0,
            "usage_60_to_65" : 0,
            "usage_0_to_5" : 0,
            "usage_50_to_55" : 0,
            "usage_45_to_50" : 0,
            "usage_90_to_95" : 0,
            "usage_95_to_100" : 0,
            "usage_55_to_60" : 0,
            "usage_85_to_90" : 0
          },
          "memory_request_bytes" : 0,
          "db" : {
            "cpu_limit_cores" : 0.10000000149011612,
            "gpu_limit_devices" : 0.0,
            "memory_limit_bytes" : 134217728
          }
        },
        "sort" : [
          "app"
        ]
      }
    ]
  }
}

